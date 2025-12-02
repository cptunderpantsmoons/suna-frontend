'use client';

import { createQueryHook } from '@/hooks/use-query';
import {
  getUserCosts,
  getAllUsersCosts,
  getUserCostsById,
  getUserRole,
  UserCostsResponse,
  AllUsersCostsResponse,
} from '@/lib/api';
import { adminKeys } from './keys';

/**
 * Hook to fetch the current user's costs
 */
export const useUserCosts = (startDate?: string, endDate?: string) =>
  createQueryHook<UserCostsResponse, Error>(
    adminKeys.myCosts(startDate, endDate),
    () => getUserCosts(startDate, endDate),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  )();

/**
 * Hook to fetch all users' costs (admin only)
 */
export const useAllUsersCosts = (startDate?: string, endDate?: string, enabled = true) =>
  createQueryHook<AllUsersCostsResponse, Error>(
    adminKeys.allUsersCosts(startDate, endDate),
    () => getAllUsersCosts(startDate, endDate),
    {
      enabled,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  )();

/**
 * Hook to fetch a specific user's costs (admin only)
 */
export const useUserCostsById = (
  userId: string,
  startDate?: string,
  endDate?: string,
  enabled = true
) =>
  createQueryHook<UserCostsResponse, Error>(
    adminKeys.userCosts(userId, startDate, endDate),
    () => getUserCostsById(userId, startDate, endDate),
    {
      enabled: enabled && !!userId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  )();

/**
 * Hook to fetch user role
 */
export const useUserRole = () =>
  createQueryHook(
    adminKeys.role(),
    () => getUserRole(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    }
  )();
