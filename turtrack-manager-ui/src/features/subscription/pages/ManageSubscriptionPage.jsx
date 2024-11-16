// src/features/subscription/pages/ManageSubscriptionPage.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectSubscriptionStatus, fetchSubscription, updateSubscription } from '../redux/subscriptionSlice';
import './ManageSubscriptionPage.scss'; // Create this file for styling

const ManageSubscriptionPage = () => {
    const dispatch = useDispatch();
    const subscriptionStatus = useSelector(selectSubscriptionStatus);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState(null);

    const [selectedPlan, setSelectedPlan] = useState('');

    useEffect(() => {
        // Fetch current subscription details on component mount
        dispatch(fetchSubscription());
    }, [dispatch]);

    const handleUpgrade = async () => {
        setIsUpdating(true);
        setUpdateError(null);
        try {
            await dispatch(updateSubscription({ plan: 'premium' })).unwrap();
            alert('Subscription upgraded successfully!');
        } catch (error) {
            setUpdateError(error || 'Failed to upgrade subscription.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDowngrade = async () => {
        setIsUpdating(true);
        setUpdateError(null);
        try {
            await dispatch(updateSubscription({ plan: 'basic' })).unwrap();
            alert('Subscription downgraded successfully!');
        } catch (error) {
            setUpdateError(error || 'Failed to downgrade subscription.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRenew = async () => {
        setIsUpdating(true);
        setUpdateError(null);
        try {
            await dispatch(updateSubscription({ plan: 'renew' })).unwrap();
            alert('Subscription renewed successfully!');
        } catch (error) {
            setUpdateError(error || 'Failed to renew subscription.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = async () => {
        const confirmCancel = window.confirm('Are you sure you want to cancel your subscription?');
        if (!confirmCancel) return;

        setIsUpdating(true);
        setUpdateError(null);
        try {
            await dispatch(updateSubscription({ plan: 'cancel' })).unwrap();
            alert('Subscription canceled successfully!');
        } catch (error) {
            setUpdateError(error || 'Failed to cancel subscription.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="manage-subscription-page">
            <h2>Manage Your Subscription</h2>
            {subscriptionStatus === 'active' ? (
                <div className="subscription-details">
                    <p>Your subscription is currently <strong>Active</strong>.</p>
                    <div className="actions">
                        <button onClick={handleUpgrade} disabled={isUpdating} className="action-button upgrade">
                            Upgrade to Premium
                        </button>
                        <button onClick={handleDowngrade} disabled={isUpdating} className="action-button downgrade">
                            Downgrade to Basic
                        </button>
                        <button onClick={handleRenew} disabled={isUpdating} className="action-button renew">
                            Renew Subscription
                        </button>
                        <button onClick={handleCancel} disabled={isUpdating} className="action-button cancel">
                            Cancel Subscription
                        </button>
                    </div>
                </div>
            ) : subscriptionStatus === 'none' ? (
                <div className="no-subscription">
                    <p>You currently have no active subscription.</p>
                    <button onClick={() => window.location.href = '/pricing'} className="action-button subscribe">
                        Subscribe Now
                    </button>
                </div>
            ) : subscriptionStatus === 'expired' ? (
                <div className="expired-subscription">
                    <p>Your subscription has expired.</p>
                    <button onClick={handleRenew} disabled={isUpdating} className="action-button renew">
                        Renew Subscription
                    </button>
                </div>
            ) : (
                <p>Loading subscription details...</p>
            )}

            {updateError && <div className="error-message">{updateError}</div>}
            {isUpdating && <div className="loading-message">Processing...</div>}
        </div>
    );
};

export default ManageSubscriptionPage;
