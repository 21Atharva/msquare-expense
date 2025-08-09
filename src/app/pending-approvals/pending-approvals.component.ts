import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { ProfileComponent } from '../shared/profile/profile.component';
import { LayoutConfig } from 'src/app/shared/layout/layout.interface';
import { PageEvent } from '@angular/material/paginator';
import { ConfirmationDialogComponent, ConfirmationDialogData } from './confirmation-dialog.component';

@Component({
  selector: 'app-pending-approvals',
  templateUrl: './pending-approvals.component.html',
  styleUrls: ['./pending-approvals.component.scss']
})
export class PendingApprovalsComponent implements OnInit {
  layoutConfig!: LayoutConfig;

  // Pending Expenses
  pendingExpenses: any[] = [];
  filteredExpenses: any[] = [];
  expenseDisplayedColumns: string[] = ['employeeName', 'expenseName', 'amount', 'category', 'date', 'project', 'receipt', 'actions'];
  
  // Expense Pagination
  expensePageIndex = 0;
  expensePageSize = 5;
  expenseTotalCount = 0;
  expenseTotalPages = 0;
  
  // Expense Search
  expenseSearchTerm = '';

  // Manager Leave Approvals
  pendingManagerLeaves: any[] = [];
  filteredManagerLeaves: any[] = [];
  managerLeaveDisplayedColumns: string[] = ['managerName', 'leaveType', 'dateRange', 'totalDays', 'reason', 'appliedDate', 'leaveActions'];
  
  // Manager Leave Pagination
  leavePageIndex = 0;
  leavePageSize = 5;
  leaveTotalCount = 0;
  
  // Manager Leave Search
  leaveSearchTerm = '';
  
  // Make Math available in template
  Math = Math;

  constructor(
    public dialog: MatDialog,
    private route: Router,
    private snackBar: MatSnackBar,
    private businessData: BusinessDataService
  ) {}

  ngOnInit(): void {
    // Check if user is admin
    const userRole = localStorage.getItem('role');
    if (userRole !== 'admin') {
      this.route.navigate(['']);
      return;
    }
    
    this.loadPendingExpenses();
    this.loadPendingManagerLeaves();
    this.setupLayoutConfig();
  }

  // Helper method to open confirmation dialog
  private async openConfirmationDialog(data: ConfirmationDialogData): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: data,
      disableClose: true
    });

    const result = await dialogRef.afterClosed().toPromise();
    return !!result; // Convert to boolean
  }

  // Expense Methods
  loadPendingExpenses(page: number = 1): void {
    console.log(`📊 Loading pending expenses for page ${page}`);
    
    this.businessData.onGetPendingExpenses(page, this.expensePageSize).subscribe({
      next: (response: any) => {
        console.log('📊 Pending Expenses Response:', response);
        
        if (response && response.status) {
          this.pendingExpenses = response.data || [];
          this.expenseTotalCount = response.pagination?.totalExpenses || 0;
          this.expenseTotalPages = response.pagination?.totalPages || 0;
          this.expensePageIndex = (response.pagination?.page || 1) - 1; // Convert to 0-based
          
          // Apply search filter
          this.filterExpenses();
          
          console.log('📊 Loaded expenses:', {
            count: this.pendingExpenses.length,
            totalCount: this.expenseTotalCount,
            currentPage: this.expensePageIndex + 1
          });
        }
      },
      error: (error: any) => {
        console.error('❌ Error loading pending expenses:', error);
        
        // Handle authentication errors specifically
        if (error.status === 401) {
          console.log('🔒 Authentication failed - user will be redirected to login');
          // Auth interceptor already handles the redirect, so we don't need to do anything here
          return;
        }
        
        // Handle other errors
        const errorMessage = error?.error?.message || 'Failed to load pending expenses';
        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
      }
    });
  }

  // Search and filter expenses
  onExpenseSearch(searchTerm: string): void {
    this.expenseSearchTerm = searchTerm;
    this.expensePageIndex = 0; // Reset to first page when searching
    this.filterExpenses();
  }

  filterExpenses(): void {
    if (!this.expenseSearchTerm.trim()) {
      this.filteredExpenses = [...this.pendingExpenses];
    } else {
      const term = this.expenseSearchTerm.toLowerCase();
      this.filteredExpenses = this.pendingExpenses.filter(expense =>
        expense.userName?.toLowerCase().includes(term) ||
        expense.name?.toLowerCase().includes(term) ||
        expense.expense_category?.toLowerCase().includes(term) ||
        expense.projectName?.toLowerCase().includes(term)
      );
    }
    
    // Update pagination based on filtered results
    this.expenseTotalCount = this.filteredExpenses.length;
  }

  getPaginatedExpenses(): any[] {
    const startIndex = this.expensePageIndex * this.expensePageSize;
    const endIndex = startIndex + this.expensePageSize;
    return this.filteredExpenses.slice(startIndex, endIndex);
  }

  approveExpense(expense: any): void {
    this.openConfirmationDialog({
      title: `Approve Expense for ${expense.userName}`,
      message: `Are you sure you want to approve ${expense.userName}'s expense of $${expense.amount}?`,
      confirmText: 'Approve',
      cancelText: 'Cancel'
    }).then(confirmed => {
      if (confirmed) {
        this.businessData.onApproveExpense(expense.userId, expense._id, 'approved').subscribe({
          next: (response: any) => {
            console.log('✅ Expense approved:', response);
            this.snackBar.open('Expense approved successfully!', 'Close', { duration: 3000 });
            this.loadPendingExpenses(this.expensePageIndex + 1);
          },
          error: (error: any) => {
            console.error('❌ Error approving expense:', error);
            
            // Handle authentication errors specifically
            if (error.status === 401) {
              console.log('🔒 Authentication failed - user will be redirected to login');
              return;
            }
            
            const errorMessage = error?.error?.message || 'Failed to approve expense';
            this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  rejectExpense(expense: any): void {
    this.openConfirmationDialog({
      title: `Deny Expense for ${expense.userName}`,
      message: `Are you sure you want to deny ${expense.userName}'s expense of $${expense.amount}?`,
      confirmText: 'Deny',
      cancelText: 'Cancel'
    }).then(confirmed => {
      if (confirmed) {
        this.businessData.onApproveExpense(expense.userId, expense._id, 'rejected', 'Admin decision').subscribe({
          next: (response: any) => {
            console.log('✅ Expense rejected:', response);
            this.snackBar.open('Expense denied successfully!', 'Close', { duration: 3000 });
            this.loadPendingExpenses(this.expensePageIndex + 1);
          },
          error: (error: any) => {
            console.error('❌ Error rejecting expense:', error);
            
            // Handle authentication errors specifically
            if (error.status === 401) {
              console.log('🔒 Authentication failed - user will be redirected to login');
              return;
            }
            
            const errorMessage = error?.error?.message || 'Failed to deny expense';
            this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  viewReceipt(imageName: string): void {
    if (imageName) {
      const imageUrl = `http://localhost:3000/uploads/${imageName}`;
      window.open(imageUrl, '_blank');
    }
  }

  onExpensePageChange(event: PageEvent) {
    this.expensePageIndex = event.pageIndex;
    this.expensePageSize = event.pageSize;
    
    // If we're searching, don't reload from server, just update pagination
    if (this.expenseSearchTerm.trim()) {
      // Local pagination for search results
      return;
    }
    
    // Load new page from server
    this.loadPendingExpenses(event.pageIndex + 1);
  }

  // Manager Leave Approval Methods
  loadPendingManagerLeaves(): void {
    this.businessData.getPendingManagerLeaves().subscribe({
      next: (response: any) => {
        console.log('📋 Pending Manager Leaves Response:', response);
        this.pendingManagerLeaves = response.data || [];
        this.leaveTotalCount = this.pendingManagerLeaves.length;
        this.filterManagerLeaves();
        console.log('📋 Loaded pending manager leaves:', this.pendingManagerLeaves.length);
      },
      error: (error) => {
        console.error('❌ Error loading pending manager leaves:', error);
        
        // Handle authentication errors specifically
        if (error.status === 401) {
          console.log('🔒 Authentication failed - user will be redirected to login');
          // Auth interceptor already handles the redirect, so we don't need to do anything here
          return;
        }
        
        // Handle other errors
        const errorMessage = error?.error?.message || 'Failed to load pending manager leaves';
        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
      }
    });
  }

  // Search and filter manager leaves
  onLeaveSearch(searchTerm: string): void {
    this.leaveSearchTerm = searchTerm;
    this.leavePageIndex = 0; // Reset to first page when searching
    this.filterManagerLeaves();
  }

  filterManagerLeaves(): void {
    if (!this.leaveSearchTerm.trim()) {
      this.filteredManagerLeaves = [...this.pendingManagerLeaves];
    } else {
      const term = this.leaveSearchTerm.toLowerCase();
      this.filteredManagerLeaves = this.pendingManagerLeaves.filter(leave =>
        leave.employeeName?.toLowerCase().includes(term) ||
        leave.leaveType?.toLowerCase().includes(term) ||
        leave.reason?.toLowerCase().includes(term)
      );
    }
    
    // Update pagination based on filtered results
    this.leaveTotalCount = this.filteredManagerLeaves.length;
  }

  getPaginatedManagerLeaves(): any[] {
    const startIndex = this.leavePageIndex * this.leavePageSize;
    const endIndex = startIndex + this.leavePageSize;
    return this.filteredManagerLeaves.slice(startIndex, endIndex);
  }

  onLeavePageChange(event: PageEvent) {
    this.leavePageIndex = event.pageIndex;
    this.leavePageSize = event.pageSize;
  }

  approveManagerLeave(leave: any): void {
    this.openConfirmationDialog({
      title: `Approve Manager Leave for ${leave.employeeName}`,
      message: `Are you sure you want to approve ${leave.employeeName}'s leave application?`,
      confirmText: 'Approve',
      cancelText: 'Cancel'
    }).then(confirmed => {
      if (confirmed) {
        this.businessData.approveManagerLeave(leave.leaveId).subscribe({
          next: (response: any) => {
            console.log('✅ Manager leave approved:', response);
            this.snackBar.open('Manager leave approved successfully!', 'Close', { duration: 3000 });
            this.loadPendingManagerLeaves();
          },
          error: (error) => {
            console.error('❌ Error approving manager leave:', error);
            
            // Handle authentication errors specifically
            if (error.status === 401) {
              console.log('🔒 Authentication failed - user will be redirected to login');
              return;
            }
            
            const errorMessage = error?.error?.message || 'Failed to approve manager leave';
            this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  rejectManagerLeave(leave: any): void {
    this.openConfirmationDialog({
      title: `Deny Manager Leave for ${leave.employeeName}`,
      message: `Are you sure you want to deny ${leave.employeeName}'s leave application?`,
      confirmText: 'Deny',
      cancelText: 'Cancel'
    }).then(confirmed => {
      if (confirmed) {
        this.businessData.rejectManagerLeave(leave.leaveId, 'Admin decision').subscribe({
          next: (response: any) => {
            console.log('✅ Manager leave rejected:', response);
            this.snackBar.open('Manager leave denied successfully!', 'Close', { duration: 3000 });
            this.loadPendingManagerLeaves();
          },
          error: (error) => {
            console.error('❌ Error rejecting manager leave:', error);
            
            // Handle authentication errors specifically
            if (error.status === 401) {
              console.log('🔒 Authentication failed - user will be redirected to login');
              return;
            }
            
            const errorMessage = error?.error?.message || 'Failed to deny manager leave';
            this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  // Utility Methods for Date Formatting
  formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatOptions: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString('en-US', formatOptions);
    }
    
    return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', formatOptions)}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const formatOptions: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('en-US', formatOptions);
  }

  // Navigation methods
  onProfile(): void {
    this.dialog.open(ProfileComponent, {
      width: '600px',
    });
  }

  onLogout(): void {
    this.openConfirmationDialog({
      title: 'Logout Confirmation',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      cancelText: 'Cancel'
    }).then(confirmed => {
      if (confirmed) {
        localStorage.clear();
        this.route.navigate(['welcome']);
      }
    });
  }

  onAdminDashboard(): void {
    this.businessData.onNavigate('admin-dashboard');
  }

  onView(): void {
    this.route.navigate(['dashboard']);
  }

  onAdd(): void {
    this.businessData.onNavigate('home');
  }

  onLeaveManagement(): void {
    this.businessData.onNavigate('leave-management');
  }

  private setupLayoutConfig() {
    this.layoutConfig = {
      title: 'Msquare Portal',
      logoPath: '../../../../assets/image/msquare.png',
      navigationItems: [
        { label: 'Profile', icon: 'perm_identity', action: () => this.onProfile(), isActive: () => false },
        { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
        { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
        { label: 'Admin Dashboard', icon: 'dashboard', action: () => this.onAdminDashboard(), isActive: () => false },
        { label: 'Manage Employee Leaves', icon: 'assignment', action: () => this.onLeaveManagement(), isActive: () => false },
        { label: 'Pending Approvals', icon: 'approval', action: () => {}, isActive: () => true },
        { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
      ],
      userRole: 'admin'
    };
  }
}
