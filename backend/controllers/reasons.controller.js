const { submitDropoutReason } = require('../services/reason.service');

const submitReason = async (req, res) => {
  const { userId, reason, customReason } = req.body;
  await submitDropoutReason(userId, { reason, customReason }, req.user.id);
  res.json({ message: 'Reason submitted' });
};

module.exports = { submitReason };