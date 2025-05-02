import jsPDF from "jspdf";  // Using jsPDF library to generate PDF

const exportToPDF = (text) => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Transcription", 20, 20);
  
  // Add the transcription content
  doc.setFontSize(12);
  doc.text(text, 20, 30);

  // Save the generated PDF file
  doc.save("transcription.pdf");
};

export default exportToPDF;
