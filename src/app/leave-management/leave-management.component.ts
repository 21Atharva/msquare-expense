import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from 'src/app/shared/alert-box/alert-box.component';
import { LeaveApplication } from '../admin-dashboard/admin-dashboard.component';
import { ProfileComponent } from '../shared/profile/profile.component';
import { LayoutConfig } from 'src/app/shared/layout/layout.interface';

@Component({
  selector: 'app-leave-management',
  templateUrl: './leave-management.component.html',
  styleUrls: ['./leave-management.component.scss']
})
export class LeaveManagementComponent implements OnInit {
  layoutConfig!: LayoutConfig;
  dataSource: LeaveApplication[] = [];
  originalDataSource: LeaveApplication[] = [];
  displayedColumns: string[] = [
    'employeeName', 'dateRange', 'totalDays', 'remainingLeaves', 'status'
  ];

  isExpanded = false;
  totalCount = 0;
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;

  // Updated pagination settings
  pageSize = 10; // Changed from 6 to 10
  pageIndex = 0;
  pagedLeaves: LeaveApplication[] = [];

  userRole = '';
  searchQuery: string = '';

  // Date filter properties
  fromDate: Date | null = null;
  toDate: Date | null = null;
  filteredLeaves: LeaveApplication[] = [];

  // Search and filter state
  searchText: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private route: Router,
    private snackBar: MatSnackBar,
    private businessData: BusinessDataService
  ) {}

  ngOnInit(): void {
    this.userRole = localStorage.getItem('role') || '';
    this.setupLayoutConfig();
    this.loadAllLeaves();
  }

  loadAllLeaves(): void {
    const userRole = (localStorage.getItem('role') || '').trim();
    const userId = localStorage.getItem('Id');

    if (!userId) {
      console.error('User ID not found in localStorage.');
      return;
    }

    if (userRole === 'admin') {
      this.businessData.getAllLeaves().subscribe({
        next: (leaves) => {
          this.originalDataSource = leaves;
          this.dataSource = [...leaves];
          this.filteredLeaves = [...leaves];
          this.updatePagedLeaves();
          this.calculateStatusCounts();
        },
        error: (error) => {
          console.error('Error loading leave applications:', error);
          this.dialog.open(AlertBoxComponent, {
            width: '300px',
            data: { message: 'Failed to load leave applications.', type: 'error' }
          });
        }
      });
    } else if (userRole === 'manager') {
      // Since departments are removed, managers can see all leave applications
      this.businessData.getLeavesByManager(userId).subscribe({
        next: (response: any) => {
          const leaves = response.data || response;
          this.originalDataSource = leaves;
          this.dataSource = [...leaves];
          this.filteredLeaves = [...leaves];
          this.updatePagedLeaves();
          this.calculateStatusCounts();
        },
        error: (error) => {
          console.error('Error loading leaves for manager:', error);
        }
      });
    }
  }

  calculateStatusCounts(): void {
    // Always calculate counts from originalDataSource to show total statistics regardless of filters
    console.log('Calculating status counts from:', this.originalDataSource);
    
    this.pendingCount = this.originalDataSource.filter(leave => {
      const status = leave.status?.toLowerCase();
      return status === 'pending';
    }).length;
    
    this.approvedCount = this.originalDataSource.filter(leave => {
      const status = leave.status?.toLowerCase();
      return status === 'approved';
    }).length;
    
    this.rejectedCount = this.originalDataSource.filter(leave => {
      const status = leave.status?.toLowerCase();
      return status === 'rejected';
    }).length;
    
    this.totalCount = this.originalDataSource.length;
    
    console.log('Status counts - Total:', this.totalCount, 'Pending:', this.pendingCount, 'Approved:', this.approvedCount, 'Rejected:', this.rejectedCount);
  }

  updatePagedLeaves(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedLeaves = this.dataSource.slice(start, end);
  }

  pageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedLeaves();
  }

  // Search functionality
  applySearch(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchText = '';
    this.applyFilters();
  }

  // Reset all filters
  resetFilters(): void {
    this.searchText = '';
    this.fromDate = null;
    this.toDate = null;
    this.searchQuery = '';
    this.applyFilters();
  }

  updateStatus(leaveId: string, status: string): void {
    this.businessData.updateLeaveStatus(leaveId, status).subscribe({
      next: () => {
        const message = status === 'Approved' 
          ? 'You have approved the leave! ' 
          : 'You have rejected the leave! ';
        this.dialog.open(AlertBoxComponent, {
          data: { type: 'success', message: message }
        });
        this.loadAllLeaves();
      },
      error: (error) => {
        console.error('Failed to update status', error);
        const errorMessage = status === 'Approved' 
          ? 'Failed to approve the leave. Please try again.' 
          : 'Failed to reject the leave. Please try again.';
        this.dialog.open(AlertBoxComponent, {
          data: { type: 'error', message: errorMessage }
        });
      }
    });
  }

  // Navigation methods (unchanged)
  openDialog(): void {
    this.dialog.open(ProfileComponent, { width: '100px' });
  }

  onView(): void {
    this.route.navigate(['dashboard']);
  }

  onProfile(): void {
    this.dialog.open(ProfileComponent, {
      width: '600px',
    });
  }

  onLogout(): void {
    this.dialog.open(AlertBoxComponent, { data: { type: 'alert' } });
  }

  onLeaveApplication(): void {
    this.businessData.onNavigate('leave-management');
  }

  onLeaveManagement(): void {
    this.businessData.onNavigate('leave-management');
  }

  onEmpDashboard(): void {
    this.businessData.onNavigate('emp-dashboard');
  }

  addLeaveApplication(): void {
    this.businessData.onNavigate('leave-application');
  }

  onAdminDashboard(): void {
    this.businessData.onNavigate('admin-dashboard');
  }

  onPendingApprovals(): void {
    this.businessData.onNavigate('pending-approvals');
  }

  onAdd(): void {
    this.businessData.onNavigate('home');
  }

  getInitials(name: string): string {
    if (!name) return '';
    const nameParts = name.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }

  getCurrentDate(): string {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

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

  // Date filter methods
  onDateFilterChange(): void {
    this.applyFilters();
  }

  clearDateFilter(): void {
    this.fromDate = null;
    this.toDate = null;
    this.applyFilters();
  }

  applyFilters(): void {
    let filteredData = [...this.originalDataSource];

    // Apply date filter
    if (this.fromDate || this.toDate) {
      filteredData = this.filterLeavesByDate(filteredData);
    }

    // Apply search filter - check both searchQuery and searchText for backward compatibility
    const searchValue = this.searchQuery || this.searchText;
    if (searchValue && searchValue.trim()) {
      const filterValue = searchValue.toLowerCase().trim();
      filteredData = filteredData.filter(leave =>
        leave.employeeName.toLowerCase().includes(filterValue) ||
        leave.employeeId?.toLowerCase().includes(filterValue) ||
        leave.emailId?.toLowerCase().includes(filterValue) ||
        leave.leaveType.toLowerCase().includes(filterValue) ||
        leave.status.toLowerCase().includes(filterValue)
      );
    }

    this.filteredLeaves = filteredData;
    this.dataSource = filteredData;
    this.pageIndex = 0;
    this.updatePagedLeaves();
    
    // Update paginator if it exists
    if (this.paginator) {
      this.paginator.firstPage();
    }
    // Don't recalculate status counts - they should always show totals
  }

  filterLeavesByDate(leaves: LeaveApplication[]): LeaveApplication[] {
    if (!this.fromDate && !this.toDate) {
      return leaves;
    }

    return leaves.filter(leave => {
      const leaveStartDate = new Date(leave.startDate);
      const leaveEndDate = new Date(leave.endDate);
      
      // Reset time to start of day for accurate comparison
      leaveStartDate.setHours(0, 0, 0, 0);
      leaveEndDate.setHours(23, 59, 59, 999);

      if (this.fromDate && this.toDate) {
        const fromDate = new Date(this.fromDate);
        const toDate = new Date(this.toDate);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        
        // Check if leave period overlaps with filter date range
        return (leaveStartDate <= toDate && leaveEndDate >= fromDate);
      } else if (this.fromDate) {
        const fromDate = new Date(this.fromDate);
        fromDate.setHours(0, 0, 0, 0);
        return leaveEndDate >= fromDate;
      } else if (this.toDate) {
        const toDate = new Date(this.toDate);
        toDate.setHours(23, 59, 59, 999);
        return leaveStartDate <= toDate;
      }
      return true;
    });
  }

  private setupLayoutConfig() {
    const userRole = localStorage.getItem('role') || 'employee';
    
    const employeeNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.onProfile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Leave Application', icon: 'event_note', action: () => this.addLeaveApplication(), isActive: () => false },
      { label: 'Leave Dashboard', icon: 'dashboard', action: () => this.onEmpDashboard(), isActive: () => false },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    const adminNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.onProfile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Pending Approvals', icon: 'approval', action: () => this.onPendingApprovals(), isActive: () => false },
      { label: 'Employee Leaves', icon: 'assignment', action: () => this.onLeaveApplication(), isActive: () => true },
      { label: 'Admin Dashboard', icon: 'dashboard', action: () => this.onAdminDashboard(), isActive: () => false },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    const managerNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.onProfile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Leave Dashboard', icon: 'dashboard', action: () => this.onEmpDashboard(), isActive: () => false },
      { label: 'Leave Application', icon: 'event_note', action: () => this.addLeaveApplication(), isActive: () => false },
      { label: 'Manage Employee Leaves', icon: 'assignment', action: () => this.onLeaveApplication(), isActive: () => true },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    let navigationItems;
    if (userRole === 'admin') {
      navigationItems = adminNavigationItems;
    } else if (userRole === 'manager') {
      navigationItems = managerNavigationItems;
    } else {
      navigationItems = employeeNavigationItems;
    }

    this.layoutConfig = {
      title: 'Msquare Portal',
      logoPath: '../../../../assets/image/msquare.png',
      navigationItems: navigationItems,
      userRole: userRole
    };
  }

  getDaysBetween(startDate: string, endDate: string): number | null {
    if (!startDate || !endDate) {
      return null;
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return null;
      }
      
      const timeDifference = end.getTime() - start.getTime();
      const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1;
      
      return Math.max(daysDifference, 1);
    } catch (error) {
      console.error('Error calculating days:', error);
      return null;
    }
  }

  getRemainingLeaves(employeeId: string): number {
    if (!employeeId) {
      return 24; // Default total leaves
    }

    // Calculate total approved leaves for this employee
    const approvedLeaves = this.originalDataSource
      .filter(leave => 
        (leave.employeeId === employeeId || leave.emailId === employeeId) && 
        leave.status.toLowerCase() === 'approved'
      )
      .reduce((total, leave) => {
        const days = this.getDaysBetween(leave.startDate, leave.endDate) || 
                    this.getDaysBetween((leave as any).from, (leave as any).to) || 1;
        return total + days;
      }, 0);

    // Assuming 24 total leaves per year
    const totalLeaves = 24;
    return Math.max(totalLeaves - approvedLeaves, 0);
  }

  // Check if the leave belongs to the current manager
  isManagerOwnLeave(leave: LeaveApplication): boolean {
    const currentUserEmail = localStorage.getItem('user_email');
    const currentUserRole = localStorage.getItem('role');
    
    // Only apply this logic for managers
    if (currentUserRole !== 'manager') {
      return false;
    }
    
    // Check if the leave is from the current manager
    return leave.emailId === currentUserEmail;
  }
}
