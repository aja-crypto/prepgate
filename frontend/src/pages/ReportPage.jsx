import React, { useState } from "react";
import { FileText, Download, ArrowLeft, Loader2 } from "lucide-react";
import { PDFViewer } from "@react-pdf/renderer";
import { GateNexaReport, sampleReportData, downloadPdf } from "../lib/gatenexa-report/generate";
import toast from "react-hot-toast";

export default function ReportPage() {
  const [generating, setGenerating] = useState(false);
  const data = sampleReportData;

  const handleDownload = async () => {
    setGenerating(true);
    try {
      await downloadPdf(data);
      toast.success("Report downloaded");
    } catch (e) {
      toast.error("Download failed: " + (e.message || e));
    }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A16] flex flex-col">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 border-b border-[#3A2E6E] bg-[#0A0A16]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <ArrowLeft size={16} />
          </button>
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <FileText size={14} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white">Admission Report</h1>
            <p className="text-[9px] text-slate-500">{data.candidate.displayName}</p>
          </div>
        </div>
        <button onClick={handleDownload} disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all disabled:opacity-50">
          {generating ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          {generating ? "Generating..." : "Download PDF"}
        </button>
      </div>
      <PDFViewer style={{ flex: 1, width: "100%", border: "none" }} showToolbar>
        <GateNexaReport data={data} />
      </PDFViewer>
    </div>
  );
}
