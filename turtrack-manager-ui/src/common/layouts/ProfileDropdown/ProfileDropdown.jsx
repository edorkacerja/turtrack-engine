import { ExternalLink, LogIn, LogOut, CreditCard } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from "@/common/api/axios.js";
import { API_BASE_URL } from "@/common/util/constants.js";
import {
    selectSubscription,
    selectCurrentPrice,
    selectIsSubscriptionActive,
    selectIsCancelled,
    selectProducts
} from '@/features/subscription/redux/subscriptionSlice';
import './ProfileDropdown.scss'

const ProfileDropdown = ({ user, onLogout, isOpen }) => {
    const subscription = useSelector(selectSubscription);
    const currentPrice = useSelector(selectCurrentPrice);
    const products = useSelector(selectProducts);
    const isActive = useSelector(selectIsSubscriptionActive);
    const isCancelled = useSelector(selectIsCancelled);

    const getCurrentProductName = () => {
        if (!currentPrice || !products) return 'Standard Plan';

        const product = products.find(p =>
            p.availablePrices?.some(price => price.id === currentPrice.id)
        );

        if (!product) return currentPrice?.nickname || 'Standard Plan';

        return `${product.name} ${currentPrice?.nickname || ''}`.trim();
    };

    const handleManageSubscription = async () => {
        try {
            const response = await api.post(`${API_BASE_URL}/payment/create-portal-session`, {
                email: user.email,
                returnUrl: window.location.origin + '/dashboard'
            });

            window.location.href = response.data.url;
        } catch (error) {
            console.error('Error creating portal session:', error);
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getSubscriptionStatusDisplay = () => {
        if (!currentPrice) return 'No active subscription';
        if (isCancelled) return 'Cancels at end of period';
        return 'Active';
    };

    return (
        <div className={`profile-dropdown ${isOpen ? 'show' : ''}`}>
            <div className="profile-dropdown-header">
                <p className="user-name">{user.firstName} {user.lastName}</p>
                <p className="user-email">{user.email}</p>
            </div>

            <div className="subscription-info border-t border-b border-gray-200 my-2 py-2">
                <div className="flex flex-col gap-1 text-sm text-green-800">
                    <div className="flex justify-between items-center">
                        <span>Status:</span>
                        <span className={`font-medium ${subscription?.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                            {getSubscriptionStatusDisplay()}
                        </span>
                    </div>

                    {currentPrice && (
                        <>
                            <div className="flex justify-between items-center">
                                <span>Plan:</span>
                                <span className="font-medium text-gray-900">
                                    {getCurrentProductName()}
                                </span>
                            </div>

                            {subscription.currentPeriodEnd && (
                                <div className="flex justify-between items-center">
                                    <span>Current Period:</span>
                                    <span className="font-medium text-gray-900">
                                        Until {formatDate(subscription.currentPeriodEnd)}
                                    </span>
                                </div>
                            )}

                            {subscription.billingCycle && (
                                <div className="flex justify-between items-center">
                                    <span>Billing:</span>
                                    <span className="font-medium text-gray-900">
                                        {subscription.billingCycle.charAt(0).toUpperCase() +
                                            subscription.billingCycle.slice(1)}ly
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <button
                onClick={handleManageSubscription}
                className="dropdown-button"
            >
                <CreditCard size={16} />
                <span>{currentPrice ? 'Manage Subscription' : 'Subscribe Now'}</span>
            </button>

            <button
                onClick={onLogout}
                className="logout-button"
            >
                <LogOut size={16} />
                <span>Sign out</span>
            </button>
        </div>
    );
};

export default ProfileDropdown;