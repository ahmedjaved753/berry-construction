"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PoundSterling, Loader2 } from "lucide-react";

interface BudgetEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => Promise<void>;
  currentBudget: number;
  stageName: string;
  departmentId: string;
  stageId: string;
}

export function BudgetEditDialog({
  isOpen,
  onClose,
  onSave,
  currentBudget,
  stageName,
  departmentId,
  stageId,
}: BudgetEditDialogProps) {
  const [budgetAmount, setBudgetAmount] = useState(
    currentBudget > 0 ? currentBudget.toString() : ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const amount = parseFloat(budgetAmount);

    if (isNaN(amount) || amount < 0) {
      setError("Please enter a valid positive number");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(amount);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save budget");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, "");
    // Ensure only one decimal point
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }
    return cleaned;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setBudgetAmount(formatted);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PoundSterling className="h-5 w-5 text-blue-600" />
            Set Budget for Stage
          </DialogTitle>
          <DialogDescription>
            Set the budget for <span className="font-semibold">{stageName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="budget-amount">Budget Amount (£)</Label>
            <div className="relative">
              <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="budget-amount"
                type="text"
                placeholder="0.00"
                value={budgetAmount}
                onChange={handleInputChange}
                className="pl-9"
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          {currentBudget > 0 && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm">
              <p className="text-gray-700">
                Current budget:{" "}
                <span className="font-semibold">
                  £{currentBudget.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !budgetAmount}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Saving..." : "Save Budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
