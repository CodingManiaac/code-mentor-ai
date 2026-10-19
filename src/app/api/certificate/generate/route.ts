import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const username = session?.user?.name || "Student Learner";
    const userId = session?.user?.id;
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic") || "Computer Science";
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const hash = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Renders an extremely beautiful, print-ready HTML certificate page
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate of Mastery - ${topic}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Montserrat:wght@400;600;700&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      background-color: #0c0a09;
      color: #fafaf9;
      font-family: 'Montserrat', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    
    .certificate-container {
      width: 840px;
      height: 590px;
      background: radial-gradient(circle, #1c1917 0%, #0c0a09 100%);
      border: 8px double #d97706;
      border-radius: 8px;
      padding: 40px;
      position: relative;
      box-sizing: border-box;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }
    
    .certificate-container::before {
      content: "";
      position: absolute;
      inset: 20px;
      border: 1px solid rgba(217, 119, 6, 0.2);
      pointer-events: none;
    }

    .corner-decoration {
      position: absolute;
      width: 40px;
      height: 40px;
      border: 2px solid #d97706;
      pointer-events: none;
    }
    
    .top-left { top: 30px; left: 30px; border-right: none; border-bottom: none; }
    .top-right { top: 30px; right: 30px; border-left: none; border-bottom: none; }
    .bottom-left { bottom: 30px; left: 30px; border-right: none; border-top: none; }
    .bottom-right { bottom: 30px; right: 30px; border-left: none; border-top: none; }
    
    .header {
      text-align: center;
      margin-top: 20px;
    }
    
    .logo {
      font-family: 'Cinzel', serif;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 4px;
      color: #d97706;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    
    .title {
      font-family: 'Cinzel', serif;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #ffffff;
      margin: 15px 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    
    .subtitle {
      font-size: 14px;
      color: #a8a29e;
      letter-spacing: 1px;
      margin-bottom: 30px;
    }
    
    .name {
      font-size: 28px;
      font-weight: 700;
      color: #fbbf24;
      text-align: center;
      margin: 20px 0;
      border-bottom: 2px solid rgba(217, 119, 6, 0.3);
      display: inline-block;
      padding-bottom: 8px;
      width: 80%;
      margin-left: 10%;
    }
    
    .description {
      text-align: center;
      font-size: 14px;
      color: #d6d3d1;
      line-height: 1.6;
      max-width: 600px;
      margin: 20px auto;
    }
    
    .topic-highlight {
      font-weight: 700;
      color: #ffffff;
      text-decoration: underline;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 60px;
      padding: 0 40px;
    }
    
    .signature-block {
      text-align: center;
      width: 180px;
    }
    
    .signature-line {
      border-top: 1px solid #78716c;
      margin-top: 30px;
      padding-top: 8px;
      font-size: 10px;
      color: #a8a29e;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .signature-font {
      font-family: 'Cinzel', serif;
      font-style: italic;
      font-size: 14px;
      color: #e7e5e4;
    }
    
    .badge-seal {
      width: 80px;
      height: 80px;
      background: radial-gradient(circle, #fbbf24 0%, #b45309 100%);
      border-radius: 50%;
      border: 4px solid #fafaf9;
      box-shadow: 0 0 20px rgba(217, 119, 6, 0.4);
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      color: #000;
      font-size: 10px;
      text-align: center;
      letter-spacing: 1px;
      transform: rotate(-10deg);
    }
    
    .verify-code {
      position: absolute;
      bottom: 20px;
      left: 40px;
      font-size: 9px;
      color: #78716c;
      font-family: monospace;
    }
    
    .print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #d97706;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      transition: background 0.2s;
    }
    
    .print-btn:hover {
      background-color: #b45309;
    }
    
    @media print {
      .print-btn { display: none; }
      body { background-color: #ffffff; color: #000000; }
      .certificate-container { box-shadow: none; border-color: #000000; }
    }
  </style>
</head>
<body>

  <button class="print-btn" onclick="window.print()">Print to PDF</button>

  <div class="certificate-container">
    <div class="corner-decoration top-left"></div>
    <div class="corner-decoration top-right"></div>
    <div class="corner-decoration bottom-left"></div>
    <div class="corner-decoration bottom-right"></div>
    
    <div class="header">
      <div class="logo">CodeMentor AI</div>
      <div class="title">Certificate of Mastery</div>
      <div class="subtitle">THIS CERTIFICATE IS PROUDLY PRESENTED TO</div>
    </div>
    
    <div class="name">${username}</div>
    
    <div class="description">
      for successfully completing the adaptive curriculum and mastering the concepts of 
      <span class="topic-highlight">${topic}</span> with outstanding accuracy, completing 
      challenges, and displaying exemplary knowledge of Data Structures and Algorithms.
    </div>
    
    <div class="footer">
      <div class="signature-block">
        <div class="signature-font">${date}</div>
        <div class="signature-line">Date Issued</div>
      </div>
      
      <div class="badge-seal">
        BST<br>MASTER
      </div>
      
      <div class="signature-block">
        <div class="signature-font">CodeMentor AI</div>
        <div class="signature-line">Authorized Signature</div>
      </div>
    </div>
    
    <div class="verify-code">Verification Hash: CM-${hash}-${userId.slice(0, 4).toUpperCase()}</div>
  </div>

</body>
</html>
    `;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
