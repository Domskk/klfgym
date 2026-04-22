const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/db');

const generateQRForMember = async (userId) => {
  const qrToken = `KLF-${uuidv4().slice(0, 12)}`;
  await supabase.from('users').update({ qr_token: qrToken }).eq('id', userId);
  const qrImage = await QRCode.toDataURL(`KLF-SCAN:${qrToken}`);
  return { qrToken, qrImage };
};

module.exports = { generateQRForMember };