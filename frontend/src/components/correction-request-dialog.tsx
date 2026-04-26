"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { correctionsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CorrectionFormData {
  field_name: string;
  current_value: string;
  requested_value: string;
  reason: string;
}

export function CorrectionRequestDialog() {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<CorrectionFormData>();
  const { toast } = useToast();

  const onSubmit = async (data: CorrectionFormData) => {
    try {
      await correctionsAPI.create(data);
      toast({ title: "Success", description: "Correction request submitted successfully" });
      setOpen(false);
      reset();
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit correction request", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Request Correction</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Data Correction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Field Name</Label>
            <Input {...register("field_name", { required: true })} placeholder="e.g., cgpa, attendance_pct" />
          </div>
          <div>
            <Label>Current Value</Label>
            <Input {...register("current_value")} placeholder="Current value" />
          </div>
          <div>
            <Label>Requested Value</Label>
            <Input {...register("requested_value", { required: true })} placeholder="Correct value" />
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea {...register("reason", { required: true })} placeholder="Explain why this correction is needed" />
          </div>
          <Button type="submit" className="w-full">Submit Request</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
