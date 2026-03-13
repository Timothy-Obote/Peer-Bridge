import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useDropzone } from 'react-dropzone';
import forge from 'node-forge';

const ChatInterface = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<{ id: number; name: string; publicKey?: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Redirect if no matchId or missing auth
  useEffect(() => {
    if (!matchId || !token || !user.id) {
      navigate('/');
    }
  }, [matchId, token, user.id, navigate]);

  // Fetch chat details and other user info
  useEffect(() => {
    if (!matchId || !token || !user.id) return;

    const fetchData = async () => {
      try {
        // 1. Fetch match details to know the other participant
        const matchRes = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/${matchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!matchRes.ok) throw new Error('Failed to fetch match');
        const match = await matchRes.json();
        const otherId = match.tutor_id === user.id ? match.tutee_id : match.tutor_id;
        setOtherUser({ id: otherId, name: '' });

        // 2. Fetch chat history
        const historyRes = await fetch(`${import.meta.env.VITE_API_URL}/api/chats/${matchId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!historyRes.ok) throw new Error('Failed to fetch messages');
        const history = await historyRes.json();
        setMessages(history);

        // 3. Fetch other user's public key
        const keyRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${otherId}/public-key`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!keyRes.ok) throw new Error('Failed to fetch public key');
        const keyData = await keyRes.json();
        setOtherUser(prev => prev ? { ...prev, publicKey: keyData.publicKey } : null);

        // 4. Connect Socket.IO
        const newSocket = io(import.meta.env.VITE_API_URL);
        socketRef.current = newSocket;

        newSocket.emit('user-online', user.id);
        newSocket.emit('join-chat', { chatId: matchId, userId: user.id });

        newSocket.on('new-message', (msg) => {
          setMessages(prev => [...prev, msg]);
          // Emit delivery acknowledgment for this message
          if (msg.sender_id !== user.id) {
            socketRef.current?.emit('message-delivered', {
              messageId: msg.id,
              recipientId: user.id
            });
          }
        });

        newSocket.on('user-typing', ({ userId, isTyping }) => {
          if (userId !== user.id) setIsTyping(isTyping);
        });

      } catch (err) {
        console.error(err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [matchId, token, user.id, navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 👇 Message read status observer
  useEffect(() => {
    if (!socketRef.current || !user.id) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const messageId = entry.target.getAttribute('data-message-id');
          if (messageId) {
            socketRef.current.emit('message-read', {
              messageId: parseInt(messageId),
              readerId: user.id
            });
          }
        }
      });
    }, { threshold: 0.5 });

    // Observe all elements with data-message-id attribute
    document.querySelectorAll('[data-message-id]').forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, user.id]);

  // Encrypt message using recipient's public key
  const encryptMessage = (plainText: string, publicKeyPem: string) => {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const encrypted = publicKey.encrypt(plainText);
    return forge.util.encode64(encrypted);
  };

  // Decrypt message with own private key
  const decryptMessage = (encryptedBase64: string) => {
    const privateKeyPem = localStorage.getItem('privateKey');
    if (!privateKeyPem) return '[Encrypted]';
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const encrypted = forge.util.decode64(encryptedBase64);
    return privateKey.decrypt(encrypted);
  };

  const sendMessage = () => {
    if (!input.trim() || !otherUser?.publicKey || !socketRef.current) return;
    const encrypted = encryptMessage(input, otherUser.publicKey);
    socketRef.current.emit('send-message', {
      chatId: matchId,
      senderId: user.id,
      recipientId: otherUser.id,
      encryptedMessage: encrypted,
      mediaUrl: null,
      mediaType: null,
    }, (ack: any) => {
      if (!ack.success) alert('Failed to send message');
    });
    setInput('');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    socketRef.current?.emit('typing', { chatId: matchId, userId: user.id, isTyping: e.target.value.length > 0 });
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (!otherUser?.publicKey || !socketRef.current) return;
    const file = acceptedFiles[0];
    const sigRes = await fetch(`${import.meta.env.VITE_API_URL}/api/upload-signature`, {
      headers: { Authorization: `Bearer ${token}` },
    });
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
    const uploadData = await uploadRes.json();

    const encrypted = encryptMessage('', otherUser.publicKey);
    socketRef.current.emit('send-message', {
      chatId: matchId,
      senderId: user.id,
      recipientId: otherUser.id,
      encryptedMessage: encrypted,
      mediaUrl: uploadData.secure_url,
      mediaType: file.type.split('/')[0],
    });
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  if (loading) return <div>Loading chat...</div>;

  return (
    <div className="chat-container">
      <div className="message-list">
        {messages.map(msg => {
          const isMe = msg.sender_id === user.id;
          const decrypted = isMe ? msg.encrypted_message : decryptMessage(msg.encrypted_message);
          return (
            <div key={msg.id} className={isMe ? 'my-message' : 'their-message'} data-message-id={msg.id}>
              {msg.media_url && (
                <img src={msg.media_url} alt="media" style={{ maxWidth: '200px' }} />
              )}
              <p>{decrypted}</p>
              <span className="message-status">{msg.status}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {isTyping && <div className="typing-indicator">Tutor is typing...</div>}

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={handleTyping}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
        <div {...getRootProps()} className="upload-area">
          <input {...getInputProps()} />
          📎 Attach
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;