import { motion } from "framer-motion";
import { FileText, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";

export default function Reports() {
  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-3">Generate report</h3>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => toast.success("PDF generated")} className="rounded-2xl gradient-brand text-white"><FileText className="w-4 h-4 mr-2" /> Weekly PDF</Button>
          <Button onClick={() => toast.success("CSV downloaded")} variant="outline" className="rounded-2xl"><Download className="w-4 h-4 mr-2" /> CSV export</Button>
          <Button onClick={() => toast.success("Sent via email")} variant="outline" className="rounded-2xl"><Mail className="w-4 h-4 mr-2" /> Email</Button>
        </div>
      </motion.div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-3">Scheduled reports</h3>
        {[
          "Weekly email every Monday at 9 AM",
          "Monthly summary on the 1st",
          "Instant alert for high-risk blocks",
        ].map((label, i) => (
          <div key={label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <span className="text-sm">{label}</span>
            <Switch defaultChecked={i < 2} />
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h3 className="font-bold mb-3">Recent reports</h3>
        <div className="space-y-2">
          {["Weekly · Apr 14", "Weekly · Apr 7", "Monthly · March"].map(r => (
            <div key={r} className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5">
              <span className="text-sm font-semibold">{r}</span>
              <button onClick={() => toast.success("Downloaded")} className="text-xs text-primary font-semibold">Download</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
