import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { useDropzone } from 'react-dropzone';
import forge from 'node-forge';
import { generateAndStoreKeys } from './utils/encryption';
import './ChatInterface.css';

interface MatchCourse {
  code: string;
  name: string;
}

interface MatchDetails {
  id: number;
  tutor_id: number;
  tutee_id: number;
  tutor_name: string;
  tutee_name: string;
  chat_id: number;
  courses: MatchCourse[];
}

interface ChatMessage {
  id: number;
  chat_id: number;
  sender_id: number;
  recipient_id: number;
  encrypted_message: string;
  media_url: string | null;
  media_type: string | null;
  status: string;
  created_at: string;
  sender_name?: string;
}

interface OtherUser {
  id: number;
  name: string;
  publicKey?: string;
}

interface KeyResponse {
  publicKey: string | null;
}

const ChatInterface = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [selfPublicKey, setSelfPublicKey] = useState<string | null>(localStorage.getItem('publicKey'));
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const formatMessageTime = (value: string) =>
    new Date(value).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  useEffect(() => {
    if (!matchId || !token || !user.id) {
      navigate('/');
    }
  }, [matchId, token, user.id, navigate]);

  useEffect(() => {
    if (!matchId || !token || !user.id) return;

    let active = true;

    const fetchChatData = async () => {
      setLoading(true);
      setError('');

      try {
        const matchRes = await fetch(`${import.meta.env.VITE_API_URL}/api/match/${matchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!matchRes.ok) {
          throw new Error(matchRes.status === 403 ? 'You do not have access to this chat.' : 'Failed to load match.');
        }

        const matchData: MatchDetails = await matchRes.json();
        const resolvedChatId = Number(matchData.chat_id);
        const otherId = matchData.tutor_id === user.id ? matchData.tutee_id : matchData.tutor_id;
        const otherName = matchData.tutor_id === user.id ? matchData.tutee_name : matchData.tutor_name;

        const [historyRes, otherKeyRes, selfKeyRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/chats/${matchId}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/users/${otherId}/public-key`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/public-key`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!historyRes.ok) {
          throw new Error('Failed to load chat history.');
        }

        const history: ChatMessage[] = await historyRes.json();
        const nextOtherUser: OtherUser = { id: otherId, name: otherName || 'Matched user' };

        if (otherKeyRes.ok) {
          const otherKeyData: KeyResponse = await otherKeyRes.json();
          if (otherKeyData.publicKey) {
            nextOtherUser.publicKey = otherKeyData.publicKey;
          }
        } else if (otherKeyRes.status !== 404) {
          throw new Error('Failed to load the other user key.');
        }

        let nextSelfPublicKey = localStorage.getItem('publicKey');
        if (selfKeyRes.ok) {
          const selfKeyData: KeyResponse = await selfKeyRes.json();
          if (selfKeyData.publicKey) {
            nextSelfPublicKey = selfKeyData.publicKey;
            localStorage.setItem('publicKey', selfKeyData.publicKey);
          }
        } else if (selfKeyRes.status !== 404) {
          throw new Error('Failed to load your encryption key.');
        }

        if (!nextSelfPublicKey) {
          await generateAndStoreKeys();
          nextSelfPublicKey = localStorage.getItem('publicKey');
        }

        if (!active) return;

        setMatch(matchData);
        setChatId(resolvedChatId);
        setMessages(history);
        setOtherUser(nextOtherUser);
        setSelfPublicKey(nextSelfPublicKey);

        const newSocket = io(import.meta.env.VITE_API_URL, {
          auth: { token },
        });

        newSocket.on('connect_error', (socketError: Error) => {
          if (active) {
            setError(socketError.message || 'Unable to connect to chat.');
          }
        });

        newSocket.on('new-message', (incoming: ChatMessage) => {
          setMessages((prev) => {
            if (prev.some((message) => message.id === incoming.id)) {
              return prev;
            }
            return [...prev, incoming];
          });

          if (incoming.recipient_id === user.id && incoming.sender_id !== user.id) {
            newSocket.emit('message-delivered', { messageId: incoming.id });
          }
        });

        newSocket.on('message-status-updated', ({ messageId, status }: { messageId: number; status: string }) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === messageId ? { ...message, status } : message
            )
          );
        });

        newSocket.on('user-typing', ({ userId, isTyping: nextTyping }: { userId: number; isTyping: boolean }) => {
          if (userId !== user.id) {
            setIsTyping(nextTyping);
          }
        });

        socketRef.current = newSocket;
        newSocket.emit('user-online');
        newSocket.emit('join-chat', { chatId: resolvedChatId }, (ack: any) => {
          if (!ack?.success && active) {
            setError(ack?.error || 'Failed to join chat room.');
          }
        });
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(err.message || 'Failed to load chat.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchChatData();

    return () => {
      active = false;
      setIsTyping(false);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [matchId, token, user.id, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socketRef.current || !user.id) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const messageId = entry.target.getAttribute('data-message-id');
        if (messageId) {
          socketRef.current.emit('message-read', {
            messageId: parseInt(messageId, 10),
          });
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-message-id]').forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [messages, user.id]);

  const encryptForKey = (plainText: string, publicKeyPem: string) => {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encrypted = publicKey.encrypt(plainText);
    return forge.util.encode64(encrypted);
  };

  const decryptCiphertext = (encryptedBase64: string) => {
    const privateKeyPem = localStorage.getItem('privateKey');
    if (!privateKeyPem) {
      throw new Error('Missing private key');
    }

    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const encrypted = forge.util.decode64(encryptedBase64);
    return privateKey.decrypt(encrypted);
  };

  const buildStoredMessage = (plainText: string) => {
    if (otherUser?.publicKey && selfPublicKey) {
      return JSON.stringify({
        recipient: encryptForKey(plainText, otherUser.publicKey),
        sender: encryptForKey(plainText, selfPublicKey),
      });
    }

    return plainText;
  };

  const renderMessageText = (storedMessage: string, isMe: boolean) => {
    if (!storedMessage) return '';

    try {
      const parsed = JSON.parse(storedMessage);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const encryptedForViewer = isMe ? parsed.sender : parsed.recipient;
        if (typeof encryptedForViewer === 'string' && encryptedForViewer) {
          return decryptCiphertext(encryptedForViewer);
        }
      }
    } catch {
      // Ignore and try legacy/plaintext rendering below.
    }

    try {
      return decryptCiphertext(storedMessage);
    } catch {
      return storedMessage;
    }
  };

  const sendMessage = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || !chatId || !socketRef.current || !otherUser) return;

    socketRef.current.emit(
      'send-message',
      {
        chatId,
        encryptedMessage: buildStoredMessage(trimmedInput),
        mediaUrl: null,
        mediaType: null,
      },
      (ack: any) => {
        if (!ack?.success) {
          setError(ack?.error || 'Failed to send message.');
        }
      }
    );

    setInput('');
    socketRef.current.emit('typing', { chatId, isTyping: false });
  };

  const handleTyping = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setInput(nextValue);

    if (chatId) {
      socketRef.current?.emit('typing', {
        chatId,
        isTyping: nextValue.length > 0,
      });
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length || !chatId || !socketRef.current) return;

    try {
      const file = acceptedFiles[0];
      const sigRes = await fetch(`${import.meta.env.VITE_API_URL}/api/upload-signature`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!sigRes.ok) {
        throw new Error('Failed to prepare file upload.');
      }

      const { timestamp, signature, apiKey, cloudName } = await sigRes.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload attachment.');
      }

      const uploadData = await uploadRes.json();

      socketRef.current.emit(
        'send-message',
        {
          chatId,
          encryptedMessage: buildStoredMessage(''),
          mediaUrl: uploadData.secure_url,
          mediaType: file.type.split('/')[0] || 'file',
        },
        (ack: any) => {
          if (!ack?.success) {
            setError(ack?.error || 'Failed to send attachment.');
          }
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to upload attachment.');
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });
  const encryptionEnabled = Boolean(otherUser?.publicKey && selfPublicKey);
  const canSend = Boolean(chatId && socketRef.current);
  const courseSummary = match?.courses.map((course) => `${course.code} - ${course.name}`).join(', ');
  const chatPartnerInitial = otherUser?.name?.trim().charAt(0).toUpperCase() || '?';

  if (loading) {
    return <div className="chat-loading">Loading chat...</div>;
  }

  if (!match || !otherUser) {
    return <div className="chat-loading">{error || 'Chat unavailable.'}</div>;
  }

  return (
    <div className="chat-shell">
      <div className="chat-window">
        <div className="chat-header">
          <button type="button" className="chat-back-button" onClick={() => navigate(-1)}>
            Back
          </button>
          <div className="chat-avatar">{chatPartnerInitial}</div>
          <div className="chat-header-copy">
            <h2>Chat with {otherUser.name}</h2>
            <p>{courseSummary}</p>
          </div>
          <div className="chat-header-meta">
            <span className={`chat-pill ${encryptionEnabled ? 'chat-pill--secure' : 'chat-pill--pending'}`}>
              {encryptionEnabled ? 'End-to-end encryption ready' : 'Waiting for keys'}
            </span>
          </div>
        </div>

        {error && <div className="chat-error-banner">{error}</div>}

        <div className="message-list">
          {messages.length === 0 && (
            <div className="chat-empty-state">
              <h3>No messages yet</h3>
              <p>Start the conversation and coordinate your session here.</p>
            </div>
          )}
        {messages.map((message) => {
          const isMe = message.sender_id === user.id;
          const renderedText = renderMessageText(message.encrypted_message, isMe);

          return (
            <div
              key={message.id}
              className={`message-row ${isMe ? 'message-row--me' : 'message-row--them'}`}
              data-message-id={message.id}
            >
              <div className={isMe ? 'my-message' : 'their-message'}>
                {message.media_url && message.media_type === 'image' && (
                  <img className="message-image" src={message.media_url} alt="attachment" />
                )}
                {message.media_url && message.media_type !== 'image' && (
                  <a className="message-file" href={message.media_url} target="_blank" rel="noreferrer">
                    Open attachment
                  </a>
                )}
                {renderedText && <p className="message-text">{renderedText}</p>}
                <div className="message-meta">
                  <span>{formatMessageTime(message.created_at)}</span>
                  {isMe && <span className="message-status">{message.status}</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
        </div>

        {isTyping && <div className="typing-indicator">{otherUser.name} is typing...</div>}

        <div className="input-area">
          <div {...getRootProps()} className={`upload-area ${!canSend ? 'upload-area--disabled' : ''}`}>
            <input {...getInputProps()} disabled={!canSend} />
            Attach
          </div>
          <input
            type="text"
            value={input}
            onChange={handleTyping}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            disabled={!canSend}
          />
          <button className="send-button" onClick={sendMessage} disabled={!canSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
