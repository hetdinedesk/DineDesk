import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CMS_API_URL } from '../lib/api';

const LoyaltyContext = createContext(null);

export const useLoyalty = () => {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty must be used within LoyaltyProvider');
  }
  return context;
};

export const LoyaltyProvider = ({ children, clientId, loyaltyConfig: initialConfig }) => {
  const [customer, setCustomer] = useState(null);
  const [loyaltyConfig, setLoyaltyConfig] = useState(initialConfig || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load loyalty config from API if not provided
  useEffect(() => {
    if (clientId && !initialConfig) {
      fetchLoyaltyConfig();
    }
  }, [clientId, initialConfig]);

  const fetchLoyaltyConfig = useCallback(async () => {
    if (!clientId) return;
    
    try {
      const response = await fetch(`${CMS_API_URL}/api/clients/${clientId}/loyalty/config`);
      if (response.ok) {
        const config = await response.json();
        setLoyaltyConfig(config);
      }
    } catch (err) {
      console.error('Failed to fetch loyalty config:', err);
    }
  }, [clientId]);

  // Lookup customer by phone number
  const lookupCustomer = useCallback(async (phone) => {
    if (!clientId || !phone) return null;

    setLoading(true);
    setError(null);

    try {
      const normalizedPhone = phone.replace(/[\s\-()]/g, '');
      const response = await fetch(`${CMS_API_URL}/api/loyalty/customers/${normalizedPhone}?clientId=${clientId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setCustomer(data.customer);
          return data.customer;
        } else {
          setCustomer(null);
          return null;
        }
      }
      return null;
    } catch (err) {
      console.error('Customer lookup error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Create or update customer
  const upsertCustomer = useCallback(async (phone, name, email) => {
    if (!clientId || !phone) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CMS_API_URL}/api/loyalty/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, phone, name, email })
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        return data;
      }
      return null;
    } catch (err) {
      console.error('Customer creation error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Redeem reward
  const redeemReward = useCallback(async (rewardId) => {
    if (!customer) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CMS_API_URL}/api/loyalty/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id, rewardId })
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
        return data;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to redeem reward');
        return null;
      }
    } catch (err) {
      console.error('Reward redemption error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [customer]);

  // Check if customer can redeem a specific reward
  const canRedeemReward = useCallback((reward) => {
    if (!customer || !reward) return false;
    return customer.points >= reward.pointsRequired;
  }, [customer]);

  // Get points needed for next reward
  const getPointsToNextReward = useCallback(() => {
    if (!customer || !loyaltyConfig?.rewards || loyaltyConfig.rewards.length === 0) {
      return null;
    }

    // Find the next reward the customer can earn
    const nextReward = loyaltyConfig.rewards.find(r => r.pointsRequired > customer.points);
    if (nextReward) {
      return {
        pointsNeeded: nextReward.pointsRequired - customer.points,
        reward: nextReward
      };
    }

    // Customer can redeem all rewards
    return null;
  }, [customer, loyaltyConfig]);

  // Clear customer state (e.g., after checkout)
  const clearCustomer = useCallback(() => {
    setCustomer(null);
  }, []);

  const value = {
    customer,
    loyaltyConfig,
    loading,
    error,
    lookupCustomer,
    upsertCustomer,
    redeemReward,
    canRedeemReward,
    getPointsToNextReward,
    clearCustomer,
    isLoyaltyEnabled: loyaltyConfig?.enabled || false
  };

  return (
    <LoyaltyContext.Provider value={value}>
      {children}
    </LoyaltyContext.Provider>
  );
};
