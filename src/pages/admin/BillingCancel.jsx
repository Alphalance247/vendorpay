import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

// Stripe Checkout redirects here after a successful subscription (its
// `success_url`, which should be configured server-side to point at this
// route with `?session_id={CHECKOUT_SESSION_ID}`). There's no backend
// endpoint yet to look the session back up, so this is a presentational
// confirmation — it trusts the redirect rather than re-verifying payment.
export default function BillingCancel() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get("session_id");

    return (
        <AppLayout role="admin">
            <div className="flex items-center justify-center min-h-[70vh]">
                <Card className="max-w-md w-full text-center py-10 px-8">
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
                        <CheckCircle size={32} className="text-success" />
                    </div>

                    <h1 className="font-headline-lg text-xl font-semibold text-on-surface">
                        Payment Canceled
                    </h1>

                    <p className="text-sm text-on-surface-variant mt-2">
                        Your payment was canceled. If you have any questions, please contact our support team.
                    </p>


                    {sessionId && (
                        <p className="text-xs text-on-surface-variant mt-4 break-all">
                            Reference:
                            {sessionId}
                        </p>
                    )}

                    <Button
                        className="w-full mt-6"
                        onClick={() => navigate("/admin/billing")}
                    >
                        Back to Billing
                        <ArrowRight size={15} />
                    </Button>
                </Card>
            </div>
        </AppLayout>
    );
}
