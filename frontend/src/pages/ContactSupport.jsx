import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Phone, Mail, MessageSquare, Headphones, Shield, HelpCircle, ArrowRight } from "lucide-react";
import FarmerLayout from "./farmer/FarmerLayout";
import BuyerLayout from "./buyer/BuyerLayout";

export default function ContactSupport() {
  const { t } = useTranslation();
  const [role, setRole] = useState("farmer");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
    if (user.role) {
      setRole(user.role);
    }
  }, []);

  const pageContent = (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-[2rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 scale-150 pointer-events-none">
          <Headphones className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-3 max-w-2xl">
          <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            {t("nav.support", "Support Desk")}
          </span>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl leading-tight">
            Need Help? We're Here for You!
          </h2>
          <p className="text-emerald-100 text-sm md:text-base font-medium">
            Have questions about marketplace listings, payment settlements, crop calendar setup, or anything else? Reach out to our dedicated support team.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Contact Method: Phone Call 1 */}
        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Support Hot-Line 1</h3>
              <p className="text-gray-400 text-xs mt-1">Available for quick calls and voice assistance.</p>
            </div>
          </div>
          <div className="mt-8">
            <a href="tel:+918530748696" className="inline-flex items-center gap-2 text-green-600 font-bold hover:text-green-700 text-sm">
              +91 8530748696 <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Contact Method: Phone Call 2 */}
        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Support Hot-Line 2</h3>
              <p className="text-gray-400 text-xs mt-1">Direct support agent for marketplace and delivery issues.</p>
            </div>
          </div>
          <div className="mt-8">
            <a href="tel:+919356825993" className="inline-flex items-center gap-2 text-green-600 font-bold hover:text-green-700 text-sm">
              +91 9356825993 <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Contact Method: Email */}
        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Email Support</h3>
              <p className="text-gray-400 text-xs mt-1">Send us your queries, feedback, or verification issues.</p>
            </div>
          </div>
          <div className="mt-8">
            <a href="mailto:contact.agrismartconnect@gmail.com" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 text-sm break-all">
              contact.agrismartconnect@gmail.com <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </div>

      {/* Helpful Guidelines Card */}
      <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-200/60 grid md:grid-cols-2 gap-6 items-center">
        <div className="space-y-3">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" /> Secure Assistance
          </h4>
          <p className="text-gray-500 text-xs leading-relaxed">
            Agri-Smart Connect support agents will never ask for your account password or OTP. Only share details related to your orders, listings, or technical issues to get resolved quickly.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-green-600" /> Community Answers
          </h4>
          <p className="text-gray-500 text-xs leading-relaxed">
            Need answers immediately? You can post your agricultural questions in our interactive Community Forum to collaborate with other experienced farmers and community peers.
          </p>
        </div>
      </div>
    </div>
  );

  if (role === "buyer") {
    return <BuyerLayout>{pageContent}</BuyerLayout>;
  }

  return <FarmerLayout>{pageContent}</FarmerLayout>;
}
