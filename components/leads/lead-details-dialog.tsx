import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import LeadsList from "@/components/leads/leads-list";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { useState, useEffect } from "react";

interface LeadDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string | null;
  leadName: string;
}

export default function LeadDetailsDialog({
  isOpen,
  onClose,
  leadId,
  leadName,
}: LeadDetailsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    if (isOpen && leadId) {
      const fetchLeadDetails = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/leads/details?id=${leadId}`);
          const data = await response.json();
          if (data.followers) {
            setLeads(data.followers);
          }
        } catch (error) {
          console.error("Error fetching lead details:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchLeadDetails();
    }
  }, [isOpen, leadId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">{leadName} Details</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Showing {leads.length} leads from this list
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="mt-4">
            <LeadsList leads={leads} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 