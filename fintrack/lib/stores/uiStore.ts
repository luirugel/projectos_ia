import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  // Transaction modal
  transactionModalOpen: boolean
  editingTransactionId: string | null
  openTransactionModal: (id?: string) => void
  closeTransactionModal: () => void

  // Account modal
  accountModalOpen: boolean
  editingAccountId: string | null
  openAccountModal: (id?: string) => void
  closeAccountModal: () => void

  // Budget modal
  budgetModalOpen: boolean
  editingBudgetId: string | null
  openBudgetModal: (id?: string) => void
  closeBudgetModal: () => void

  // Goal modal
  goalModalOpen: boolean
  editingGoalId: string | null
  openGoalModal: (id?: string) => void
  closeGoalModal: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen: false,
      sidebarCollapsed: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      // Transaction modal
      transactionModalOpen: false,
      editingTransactionId: null,
      openTransactionModal: (id) => set({ transactionModalOpen: true, editingTransactionId: id ?? null }),
      closeTransactionModal: () => set({ transactionModalOpen: false, editingTransactionId: null }),

      // Account modal
      accountModalOpen: false,
      editingAccountId: null,
      openAccountModal: (id) => set({ accountModalOpen: true, editingAccountId: id ?? null }),
      closeAccountModal: () => set({ accountModalOpen: false, editingAccountId: null }),

      // Budget modal
      budgetModalOpen: false,
      editingBudgetId: null,
      openBudgetModal: (id) => set({ budgetModalOpen: true, editingBudgetId: id ?? null }),
      closeBudgetModal: () => set({ budgetModalOpen: false, editingBudgetId: null }),

      // Goal modal
      goalModalOpen: false,
      editingGoalId: null,
      openGoalModal: (id) => set({ goalModalOpen: true, editingGoalId: id ?? null }),
      closeGoalModal: () => set({ goalModalOpen: false, editingGoalId: null }),
    }),
    {
      name: 'fintrack-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
)
