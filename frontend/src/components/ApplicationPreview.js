import React, { useState } from "react";

export default function ApplicationPreview({
  applicationPreview,
  lastApplicationQA,
  setLastApplicationQA,
  setApplicationPreview,
  handleEditField,
  showPreview,
}) {
  const [isDownloaded, setIsDownloaded] = useState(false);

  if (!showPreview || !applicationPreview) return null;

  // Reset download state when preview is closed
  const handleClose = () => {
    setIsDownloaded(false);
    setApplicationPreview(null);
  };

  // 🔹 Generate clean PDF
  const generatePDF = async () => {
    // Hide edit pencils
    const pencils = document.querySelectorAll(".edit-pencil");
    pencils.forEach((btn) => (btn.style.display = "none"));
    
    // Hide buttons container
    const buttonsContainer = document.querySelector("#pdf-preview > div:last-child");
    const originalDisplay = buttonsContainer?.style.display || '';
    if (buttonsContainer) {
      buttonsContainer.style.display = 'none';
    }

    await new Promise((res) => setTimeout(res, 100));

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const input = document.getElementById("pdf-preview");
    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth - 40;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 20, 20, pdfWidth, pdfHeight);
    pdf.save(`${applicationPreview.scheme}_Application_Form.pdf`);
    setIsDownloaded(true);

    // Restore original display
    pencils.forEach((btn) => (btn.style.display = "inline"));
    if (buttonsContainer) {
      buttonsContainer.style.display = originalDisplay;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(2px)",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div
        id="pdf-preview"
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
          padding: 24,
          width: "90%",
          maxWidth: 600,
          maxHeight: "80vh",
          overflowY: "auto",
          position: "relative",
          animation: "popupScale 0.25s ease",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: 20,
            marginBottom: 4,
            color: "#1976d2",
          }}
        >
          Application Form / आवेदन पत्र / ಅರ್ಜಿ ಫಾರ್ಮ್
        </h2>
        <h4
          style={{
            textAlign: "center",
            color: "#555",
            marginBottom: 20,
            fontWeight: 500,
          }}
        >
          {applicationPreview.scheme}
        </h4>

        {/* 🔹 Questions and Answers */}
        {lastApplicationQA.length > 0 ? (
          lastApplicationQA.map((qa, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                gap: "8px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: "#333",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <strong style={{ fontWeight: 600 }}>{qa.question}</strong>
                <span
                  style={{
                    color: "#000",
                    fontWeight: 500,
                    marginLeft: 6,
                  }}
                >
                  {qa.answer || "—"}
                </span>
              </div>

              <button
                className="edit-pencil"
                onClick={() => handleEditField(qa.question, qa.question)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "#1976d2",
                  fontSize: 16,
                  flexShrink: 0,
                }}
                title="Edit"
              >
                ✏️
              </button>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#888" }}>
            No responses available.
          </p>
        )}

        {/* Footer Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginTop: 20,
            borderTop: "1px solid #eee",
            paddingTop: 12,
          }}
        >
          <button
            onClick={handleClose}
            style={{
              background: isDownloaded ? "#4caf50" : "#ccc",
              color: isDownloaded ? "#fff" : "#000",
              border: "none",
              borderRadius: 6,
              padding: "8px 14px",
              fontWeight: 600,
              cursor: "pointer",
              minWidth: isDownloaded ? 150 : 90,
              transition: "all 0.3s ease",
            }}
          >
            {isDownloaded ? "✓ Downloaded" : "Close"}
          </button>
          {!isDownloaded && (
            <button
              onClick={generatePDF}
              style={{
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                fontWeight: 600,
                cursor: "pointer",
                minWidth: 130,
              }}
            >
              Download PDF
            </button>
          )}
        </div>
      </div>

      {/* 🔹 Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes popupScale {
            from { transform: scale(0.9); opacity: 0.7; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}
