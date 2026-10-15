import type { Metadata } from "next";
import Legal, { Contact } from "@/components/Legal";

export const metadata: Metadata = { title: "Terms of Use" };

export default function Terms() {
  return (
    <Legal title="Terms of Use" updated="15 October 2026">
      <p>By using Pocket you agree to these terms. If you don&apos;t agree, please don&apos;t use the app.</p>

      <h2>Using Pocket</h2>
      <p>You must be at least 13. Keep your login details safe and give accurate information. You&apos;re responsible for activity on your account.</p>

      <h2>Fair use</h2>
      <p>Don&apos;t attack, overload or scrape the service, try to access other people&apos;s data, or use Pocket for anything illegal or abusive.</p>

      <h2>Your data</h2>
      <p>Your data stays yours. You allow us to store and process it only to run Pocket for you.</p>

      <h2>Not financial advice</h2>
      <p>Pocket is a tracking tool. Tips are automatically generated and for general information only. Pocket doesn&apos;t move money: bill splits are calculations, so check them before you pay anyone.</p>

      <h2>Groups</h2>
      <p>Anyone with an invite link can join that group. A group admin can lock a settled group and unlock it again. If an admin deletes their account, the groups they created are deleted for everyone in them.</p>

      <h2>Availability</h2>
      <p>Pocket is provided as is. It may be slow or offline at times, and features may change or stop.</p>

      <h2>Liability</h2>
      <p>To the extent the law allows, we aren&apos;t liable for indirect losses or for decisions you make using the app.</p>

      <h2>Ending your use</h2>
      <p>You can delete your account in Settings at any time. We may suspend accounts that break these terms.</p>

      <h2>Changes and law</h2>
      <p>We may update these terms and will change the date above. They are governed by the laws of India.</p>

      <h2>Contact</h2>
      <p>Questions: <Contact />.</p>
    </Legal>
  );
}
