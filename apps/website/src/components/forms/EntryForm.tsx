import React, { useCallback } from "react";
import { useSession } from "next-auth/react";
import type { Form } from "@prisma/client";

import { LoginWithTwitchButton } from "@/components/shared/LoginWithTwitchButton";
import { Headline } from "@/components/shared/Headline";
import { Button } from "@/components/shared/Button";
import { MessageBox } from "@/components/shared/MessageBox";

import { getCountryName } from "@/utils/countries";
import { trpc } from "@/utils/trpc";
import { calcFormConfig } from "@/utils/forms";
import Markdown from "@/components/content/Markdown";
import type { FormEntryWithAddress } from "@/pages/forms/[formId]";

import { ConsentFieldset } from "@/components/forms/ConsentFieldset";

import { GiveawayChecks } from "./GiveawayChecks";
import { ShippingAddressFieldset } from "./ShippingAddressFieldset";
import { NameFieldset } from "./NameFieldset";
import { ContactFieldset } from "./ContactFieldset";
import { EntryRulesFieldset } from "./EntryRulesFieldset";

export const EntryForm: React.FC<{
  form: Form;
  existingEntry: FormEntryWithAddress | null;
}> = ({ form, existingEntry }) => {
  const { data: session } = useSession();

  const config = calcFormConfig(form.config);
  const enterForm = trpc.forms.enterForm.useMutation();

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const data = new FormData(e.currentTarget);
      enterForm.mutate({
        formId: form.id,
        email: String(data.get("email")),
        givenName: String(data.get("given-name")),
        familyName: String(data.get("family-name")),
        addressLine1: String(data.get("address-line1")),
        addressLine2: String(data.get("address-line2")),
        country: String(data.get("country")),
        state: String(data.get("state")),
        city: String(data.get("city")),
        postalCode: String(data.get("postal-code")),
        acceptRules: config.hasRules
          ? String(data.get("acceptRules")) === "yes"
          : undefined,
        acceptPrivacy: String(data.get("acceptPrivacy")) === "yes",
      });
    },
    [config.hasRules, enterForm, form.id]
  );

  if (!session?.user?.id) {
    return (
      <MessageBox>
        <p className="mb-4">You need to be logged in with Twitch to enter.</p>

        <LoginWithTwitchButton />
      </MessageBox>
    );
  }

  if (enterForm.isSuccess) {
    return (
      <MessageBox variant="success">Your entry was successful!</MessageBox>
    );
  }

  if (existingEntry) {
    return (
      <>
        <MessageBox variant="success">You are already entered!</MessageBox>

        <Headline>Check your data</Headline>
        <p className="my-2">
          Username: {session.user.name}
          <br />
          Email: {existingEntry.email}
          <br />
          Name: {existingEntry.givenName} {existingEntry.familyName}
        </p>
        <p className="my-2">
          <strong>Shipping address:</strong>
          <br />
          Street address: {existingEntry.mailingAddress?.addressLine1}
          <br />
          Second address line:{" "}
          {existingEntry.mailingAddress?.addressLine2 || "-"}
          <br />
          City: {existingEntry.mailingAddress?.city}
          <br />
          State / Province / Region: {existingEntry.mailingAddress?.state}
          <br />
          Postal code/ZIP: {existingEntry.mailingAddress?.postalCode}
          <br />
          Country:{" "}
          {existingEntry.mailingAddress?.country &&
            getCountryName(existingEntry.mailingAddress?.country)}
        </p>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {config.intro && <Markdown content={config.intro} />}

      {enterForm.error && (
        <MessageBox variant="failure">
          Error: {enterForm.error.message}
        </MessageBox>
      )}

      {config.checks && (
        <>
          <Headline>Steps to enter</Headline>
          <GiveawayChecks />
        </>
      )}

      <Headline>Enter your details</Headline>

      <div className="flex flex-col gap-4">
        <NameFieldset />
        <ContactFieldset
          defaultEmailAddress={session.user.email || undefined}
        />
        <ShippingAddressFieldset />
        {config.hasRules && <EntryRulesFieldset form={form} />}

        <ConsentFieldset />
      </div>

      <div className="mt-7">
        <Button type="submit" disabled={enterForm.isLoading}>
          {config.submitButtonText || "Enter to Win"}
        </Button>
      </div>
    </form>
  );
};
