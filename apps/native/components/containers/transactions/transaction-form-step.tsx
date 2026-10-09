import { View, Text } from "react-native";
import React from "react";
import { resolveSelectOption, type SelectValue } from "@/lib/select-option";
import { SelectOption } from "@/types/transactions";
import useAuthTheme from "@/hooks/use-auth-theme";
import { FormFieldLabel } from "@/components/ui/form-field-label";
import { Select, TextArea } from "heroui-native";
import { ONBOARDING_FONT_FAMILY } from "@/lib/const/onboarding-typography";
import { GeneralChecklist2 } from "@/components/ui/icons/GeneralChecklist2";
import FormAmountInput from "@/components/base/form-amount-input";
import { GeneralChevronDo } from "@/components/ui/icons/GeneralChevronDo";
import { FormDateField } from "@/components/ui/form-date-field";

export interface TransactionFormStepProps {
  amount: string;
  onAmountChange: (text: string) => void;
  selectedCategory: SelectValue;
  onCategoryChange: (val: SelectOption | undefined) => void;
  selectedWallet: SelectValue;
  onWalletChange: (val: SelectOption | undefined) => void;
  dateDisplay: string | null;
  onDatePress: () => void;
  note: string;
  onNoteChange: (text: string) => void;
  categories: SelectOption[];
  wallets: SelectOption[];
}

export default function TransactionFormStep({
  amount,
  onAmountChange,
  selectedCategory,
  onCategoryChange,
  selectedWallet,
  onWalletChange,
  dateDisplay,
  onDatePress,
  note,
  onNoteChange,
  categories,
  wallets,
}: TransactionFormStepProps) {
  const { isDark } = useAuthTheme();
  const iconColor = isDark ? "#FFFFFF" : "#000000";

  return (
    <View className="flex-col gap-y-4 mt-5.5 px-3.75">
      <View className="flex-row gap-x-4">
        <FormAmountInput
          label="Amount"
          value={amount}
          onChangeText={onAmountChange}
          placeholder="0.00"
        />

        {/* Add Category — HeroUI Select */}
        <View className="flex-1 flex-col gap-y-2.5">
          <FormFieldLabel>Add Category</FormFieldLabel>
          <Select
            value={resolveSelectOption(selectedCategory, categories)}
            onValueChange={(val) =>
              onCategoryChange(resolveSelectOption(val as SelectValue, categories))
            }
            presentation="bottom-sheet"
          >
            <Select.Trigger
              variant="unstyled"
              className="flex-row items-center justify-between rounded-[30px] bg-brand-flashwhite dark:bg-dark-charcoal-green px-4 min-h-12"
            >
              <Select.Value
                placeholder="Select Category"
                className="text-body-sm text-brand-black dark:text-brand-white flex-1"
                numberOfLines={1}
                style={{ fontFamily: ONBOARDING_FONT_FAMILY.regular }}
              />
              <GeneralChecklist2 color={iconColor} width={24} height={24} />
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content presentation="bottom-sheet" snapPoints={["40%"]}>
                <Select.Close />
                <Select.ListLabel>Select Category</Select.ListLabel>
                {categories.map((cat) => (
                  <Select.Item
                    key={cat.value}
                    value={cat.value}
                    label={cat.label}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Select.ItemLabel />
                    </View>
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Portal>
          </Select>
        </View>
      </View>

      <View className="flex-row gap-x-4">
        {/* Wallet From — HeroUI Select */}
        <View className="flex-1 flex-col gap-y-2.5">
          <FormFieldLabel>Wallet From</FormFieldLabel>
          <Select
            value={resolveSelectOption(selectedWallet, wallets)}
            onValueChange={(val) =>
              onWalletChange(resolveSelectOption(val as SelectValue, wallets))
            }
            presentation="bottom-sheet"
          >
            <Select.Trigger
              variant="unstyled"
              className="flex-row items-center justify-between rounded-[30px] bg-brand-flashwhite dark:bg-dark-charcoal-green px-4 min-h-12"
            >
              <Select.Value
                placeholder="Select the source"
                className="text-body-md text-brand-black dark:text-brand-white flex-1"
                numberOfLines={1}
                style={{ fontFamily: ONBOARDING_FONT_FAMILY.regular }}
              />
              <GeneralChevronDo color={iconColor} width={24} height={24} />
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content presentation="bottom-sheet" snapPoints={["35%"]}>
                <Select.Close />
                <Select.ListLabel>Select Wallet</Select.ListLabel>
                {wallets.map((wallet) => (
                  <Select.Item
                    key={wallet.value}
                    value={wallet.value}
                    label={wallet.label}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Select.ItemLabel />
                    </View>
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Portal>
          </Select>
        </View>

        {/* Date&Time */}
        <FormDateField value={dateDisplay} onPress={onDatePress} />
      </View>

      {/* Note */}
      <View className="flex-col gap-y-2.5">
        <FormFieldLabel>Add Note</FormFieldLabel>
        <TextArea
          value={note}
          onChangeText={onNoteChange}
          placeholder="Salary – from professional worker"
          className="rounded-[30px] bg-brand-flashwhite dark:bg-dark-charcoal-green px-4 pt-4 pb-8 min-h-30 text-body-sm leading-3.75 text-brand-black dark:text-brand-white border-0 shadow-none focus:border-0"
          style={{
            fontFamily: ONBOARDING_FONT_FAMILY.regular,
            textAlignVertical: "top",
          }}
        />
      </View>
    </View>
  );
}
