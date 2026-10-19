import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
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
// Cursor-paginated (Stripe-style): `limit` sets the page size and
// `starting_after` is the id of the last invoice on the previous page; the
// response's `has_more` says whether another page exists.
const getBillingHistory = async ({ limit, startingAfter }) => {
    const params = { limit };
    if (startingAfter) params.starting_after = startingAfter;
    const res = await apiClient.get("/billing/invoices", { params })
    return res.data
}
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
export const useBillingHistory = ({ limit = 10, startingAfter = null, enabled = true } = {}) => {
    return useQuery({
        queryKey: ['billing-history', limit, startingAfter,],
        queryFn: () => getBillingHistory({ limit, startingAfter }),
        // Keep showing the current page while the next one loads, instead of
        // flashing an empty table on every page change.
        placeholderData: keepPreviousData,
        enabled
    })
}
