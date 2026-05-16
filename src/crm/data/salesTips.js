
export const salesTips = [
  "ग्राहक की बात ध्यान से सुनें, उनकी जरूरत को समझें। (Listen to the customer carefully, understand their needs.)",
  "हमेशा मुस्कान के साथ बात करें, यह विश्वास बनाता है। (Always talk with a smile, it builds trust.)",
  "फॉलो-अप समय पर करें, यह आपकी गंभीरता दर्शाता है। (Do follow-ups on time, it shows your seriousness.)",
  "अपने प्रोजेक्ट की पूरी जानकारी रखें, ताकि आप हर सवाल का जवाब दे सकें। (Keep complete information about your project so you can answer every question.)",
  "ग्राहक के बजट का सम्मान करें और सही विकल्प सुझाएं। (Respect the customer's budget and suggest the right options.)",
  "ना सुनने से निराश न हों, हर 'ना' आपको 'हां' के करीब ले जाती है। (Don't be discouraged by 'no', every 'no' takes you closer to 'yes'.)",
  "ईमानदारी सबसे अच्छी नीति है, कभी झूठ बोलकर सेल न करें। (Honesty is the best policy, never sell by lying.)",
  "रेफरल मांगना न भूलें, एक खुश ग्राहक आपको और ग्राहक दे सकता है। (Don't forget to ask for referrals, a happy customer can give you more customers.)",
  "धैर्य रखें, रियल एस्टेट में निर्णय लेने में समय लगता है। (Be patient, decision making takes time in real estate.)",
  "हर दिन अपना लक्ष्य निर्धारित करें और उसे पूरा करने का प्रयास करें। (Set your goal every day and try to achieve it.)"
];

export const getDailyTip = () => {
  const today = new Date();
  // Create a seed from the date string (YYYY-MM-DD)
  const dateStr = today.toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % salesTips.length;
  return salesTips[index];
};
