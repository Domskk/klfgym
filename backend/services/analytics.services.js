const calculateDropoutRisk = (features, reasons = []) => {
  const {
    attendanceFrequency = 0,
    lastVisitGapDays = 999,
    membershipDurationDays = 0,
    visitsLast7Days = 0,
    visitsLast30Days = 0,
  } = features;

  let score = 0.0;

  if (membershipDurationDays <= 7) {
    return {
      riskScore: 0.15,
      riskLevel: 'Beginner',        // ← was 'Low'
      explanation: 'New member - grace period'
    };
  }

  if (lastVisitGapDays >= 999) score += 0.45;
  else if (lastVisitGapDays > 30) score += 0.35;
  else if (lastVisitGapDays > 14) score += 0.25;

  score += Math.max(0, 15 - attendanceFrequency) * 0.035;

  if (visitsLast7Days === 0 && membershipDurationDays > 7)  score += 0.20;
  if (visitsLast30Days === 0 && membershipDurationDays > 14) score += 0.25;

  if (reasons.length > 0) {
    score += Math.min(reasons.length, 3) * 0.18;
  }

  const riskScore = Math.max(0, Math.min(1.0, score));

  // ── New labels ──────────────────────────────────────────────────────────
  let riskLevel = 'Beginner';       // was 'Low'
  if (riskScore >= 0.65)      riskLevel = 'Vigorous';   // was 'High'
  else if (riskScore >= 0.40) riskLevel = 'Moderate';   // was 'Medium'

  let explanation = '';
  if (lastVisitGapDays >= 999)    explanation = 'No visits recorded';
  else if (lastVisitGapDays > 25) explanation = `Long absence (${lastVisitGapDays} days)`;
  else if (visitsLast30Days === 0) explanation = 'No visits in the last 30 days';
  else if (attendanceFrequency < 8) explanation = 'Low attendance frequency';
  else explanation = 'Declining engagement';

  if (reasons.length > 0) {
    explanation += ` + reported "${reasons[0].reason.replace(/_/g, ' ')}"`;
  }

  return {
    riskScore: Number(riskScore.toFixed(2)),
    riskLevel,
    explanation: explanation.trim(),
  };
};

module.exports = { calculateDropoutRisk };