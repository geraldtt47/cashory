import { View, Text } from "react-native";
import React from "react";
import { resolveSelectOption, type SelectValue } from "@/lib/select-option";
import { SelectOption } from "@/types/transactions";
import { useThemeColors } from "@/lib/use-theme-colors";
import { GeneralChecklist2 } from "@/components/ui/icons/GeneralChecklist2";
import { formatDateTime } from "@/lib/format";
import { FormFieldLabel } from "@/components/ui/form-field-label";
import { FormFieldPill } from "@/components/ui/form-field-pill";
import { ONBOARDING_FONT_FAMILY } from "@/lib/const/onboarding-typography";
import FormDisplayField from "@/components/base/form-display-field";

interface TransactionSummaryStepProps {
  amount: string;
  selectedCategory: SelectValue;
  selectedWallet: SelectValue;
  selectedDate: Date;
  isDateConfirmed: boolean;
  note: string;
  categories: SelectOption[];
  wallets: SelectOption[];
}

export default function TransactionSummaryStep({
  amount,
  selectedCategory,
  selectedWallet,
  selectedDate,
  isDateConfirmed,
  note,
  categories,
  wallets,
}: TransactionSummaryStepProps) {
  const { iconColor } = useThemeColors();

  const getCategoryDisplay = () => {
    return resolveSelectOption(selectedCategory, categories)?.label ?? "Select Category";
  };

  const getWalletDisplay = () => {
    return resolveSelectOption(selectedWallet, wallets)?.label ?? "Select the source";
  };

  const checkIcon = (
    <GeneralChecklist2 color={iconColor} width={24} height={24} />
  );

  return (
    <View className="flex-col gap-y-4 mt-5.5 px-3.75">
      {/* Row 1: Amount + Category */}
      <View className="flex-row gap-x-4">
        <FormDisplayField
          label="Enter Amount"
          value={`USD$${amount || "0.00"}`}
          icon={checkIcon}
        />
        <FormDisplayField
          label="Add Category"
          value={getCategoryDisplay()}
          icon={checkIcon}
        />
      </View>

      {/* Row 2: Wallet + Date&Time */}
      <View className="flex-row gap-x-4">
        <FormDisplayField
          label="Wallet From"
          value={getWalletDisplay()}
          icon={checkIcon}
        />
        <FormDisplayField
          label="Date&Time"
          value={
            isDateConfirmed ? formatDateTime(selectedDate) : "30 Jun, 16:30 pm"
          }
          icon={checkIcon}
        />
      </View>

      {/* Note */}
      <View className="flex-col gap-y-2.5">
        <FormFieldLabel>Add Note</FormFieldLabel>
        <FormFieldPill className="pt-4 pb-8 min-h-30">
          <Text
            className="text-body-sm leading-3.75 text-brand-black dark:text-brand-white"
            style={{ fontFamily: ONBOARDING_FONT_FAMILY.regular }}
          >
            {note || "Salary – from professional worker"}
          </Text>
        </FormFieldPill>
      </View>
    </View>
  );
}
