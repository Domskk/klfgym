const supabase = require('../config/db');

const submitDropoutReason = async (userId, reasonData, submittedBy) => {
  const { reason, customReason } = reasonData;
  await supabase.from('dropout_reasons').insert({
    user_id: userId,
    reason,
    custom_reason: customReason || null,
    submitted_by: submittedBy
  });
};

module.exports = { submitDropoutReason };