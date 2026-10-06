import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../../../lib/apiClient';


const getBillingPlanList = async () => {
    const res = await apiClient.get("/billing/plans");
    return res.data
}
const changeBillingPlan = async ({ plan }) => {
    const res = await apiClient.post("/billing/checkout-session",
        { plan },
    );

    return res.data;
};
const getBillingPlanStatus = async () => {
    const res = await apiClient.get("billing/status")
    return res.data
}
// /billing/checkout-session only works for a brand-new subscription
// (e.g. Free -> paid) — it 400s with "Already on a paid plan — use the
// billing portal to change plans" once a paid subscription exists. This is
// that billing portal: a Stripe-hosted session for managing/changing an
// existing subscription.
const createBillingPortalSession = async () => {
    const res = await apiClient.post("/billing/portal-session", {})
    return res.data
}
// const getBillingPlan = async (planId) => {
//     const res = await apiClient.get(`/billing/plans/${planId}`)
//     return res.data
// }
export const useBillingPlanList = () => {
    return useQuery({
        queryKey: ['billing-plans'],
        queryFn: getBillingPlanList,
    });
};

// A checkout session is a POST that must fire on demand (button click), not
// on mount, and needs to take the chosen plan as an argument — useQuery
// can't do either of those, so this has to be a mutation.

export const useBillingStatus = () => {
    return useQuery({
        queryKey: ['billing-status'],
        queryFn: getBillingPlanStatus
    })
}
export const useChangeBilling = () => {
    return useMutation({
        mutationFn: changeBillingPlan,
        onSuccess: (data) => {
            // Stripe Checkout Sessions expose their hosted page at `.url` —
            // no in-app confirmation step, the browser leaves the SPA here.
            if (data?.url) {
                window.location.href = data.url;
            }
        },
    });
}
export const useBillingPortal = () => {
    return useMutation({
        mutationFn: createBillingPortalSession,
        onSuccess: (data) => {
            if (data?.url) {
                window.location.href = data.url;
            }
        },
    });
}
