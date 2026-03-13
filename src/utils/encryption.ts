// src/utils/encryption.ts
import forge from 'node-forge';

export const generateAndStoreKeys = async () => {
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
  const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

  localStorage.setItem('privateKey', privateKeyPem);

  const token = localStorage.getItem('token');
  if (!token) return;

  await fetch(`${import.meta.env.VITE_API_URL}/api/users/me/public-key`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ publicKey: publicKeyPem }),
  });
};