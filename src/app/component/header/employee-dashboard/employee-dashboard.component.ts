import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from 'src/app/shared/alert-box/alert-box.component';
import { ProfileComponent } from 'src/app/shared/profile/profile.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from './confirm.component';
import { LayoutConfig } from 'src/app/shared/layout/layout.interface';

interface Leave {
  [key: string]: any; 
  _id:string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string;
  totalDays?: number;
  leaveId?: string;
  createdAt?: string;
  isStartHalfDay?: boolean;
  startHalfDayType?: string;
  isEndHalfDay?: boolean;
  endHalfDayType?: string;
}

@Component({
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.scss']
})
export class EmployeeDashboardComponent implements OnInit {
  layoutConfig!: LayoutConfig;
  totalLeaves = 24;
  leavesTaken = 0;
  pendingLeaves = 0;
  employees: any[] = [];
  employeesInDept: any[] = [];
showEmployees = false;
isEmployeesLoaded = false;
employeeLeaveStatus: { [key: string]: string } = {}; // Map of email -> status

employeeColumns: string[] = ['name', 'email', 'department', 'role'];
  allLeaves: Leave[] = [];
  filteredLeaves: Leave[] = [];
  paginatedLeaves: Leave[] = [];
  pageSize = 10;
  pageIndex = 0;
  totalItems = 0;

  // Date filter
  fromDate: Date | null = null;
  toDate: Date | null = null;
  
  // Search filter
  searchText: string = '';

  // Leave type filter
  selectedLeaveType = 'all';
  leaveTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'Sick Leave', label: 'Sick Leave' },
    { value: 'Casual Leave', label: 'Casual Leave' },
    { value: 'Earned Leave', label: 'Earned Leave' },
    { value: 'Maternity Leave', label: 'Maternity Leave' },
    { value: 'Paternity Leave', label: 'Paternity Leave' }
  ];

  constructor(
    private route: Router,
    public dialog: MatDialog,
    public businessData: BusinessDataService,
     private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const gmail = localStorage.getItem('user_email');

    if (gmail) {
      this.businessData.getLeavesByEmployeeId(gmail).subscribe({
        next: (res: any) => {
          if (res?.data) {
            this.allLeaves = res.data;

            this.leavesTaken = this.allLeaves
              .filter(leave => leave.status.toLowerCase() === 'approved')
              .reduce((total, leave) => total + (leave.totalDays || 0), 0);

            this.pendingLeaves = this.allLeaves
              .filter(leave => leave.status.toLowerCase() === 'pending').length;

            this.applyFilters();
          }
        },
        error: (err: any) => {
          console.error('Error fetching leaves:', err);
        }
      });
    }
    this.setupLayoutConfig();
  }

  applyFilters(): void {
    this.filteredLeaves = this.allLeaves.filter(leave => {
      // Date range filter
      let dateMatch = true;
      if (this.fromDate || this.toDate) {
        const leaveStartDate = new Date(leave.startDate);
        const leaveEndDate = new Date(leave.endDate);
        
        if (this.fromDate) {
          const fromDate = new Date(this.fromDate);
          dateMatch = dateMatch && (leaveStartDate >= fromDate || leaveEndDate >= fromDate);
        }
        
        if (this.toDate) {
          const toDate = new Date(this.toDate);
          dateMatch = dateMatch && (leaveStartDate <= toDate || leaveEndDate <= toDate);
        }
      }
      
      // Search filter
      const searchMatch = !this.searchText || 
        leave.reason?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        leave.leaveType?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        leave.status?.toLowerCase().includes(this.searchText.toLowerCase());
      
      // Leave type filter
      const typeMatch = this.selectedLeaveType === 'all' || leave.leaveType === this.selectedLeaveType;
      
      return dateMatch && searchMatch && typeMatch;
    });

    this.totalItems = this.filteredLeaves.length;
    this.pageIndex = 0; // Reset to first page when filters change
    this.updatePaginatedLeaves();
  }

  clearFilters(): void {
    this.fromDate = null;
    this.toDate = null;
    this.searchText = '';
    this.selectedLeaveType = 'all';
    this.applyFilters();
  }

  onLeaveTypeFilterChange(): void {
    this.applyFilters();
  }

  updatePaginatedLeaves(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedLeaves = this.filteredLeaves.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedLeaves();
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return 'status-unknown';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved': return 'check_circle';
      case 'pending': return 'schedule';
      case 'rejected': return 'cancel';
      default: return 'help';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  deleteLeave(leaveId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Leave Application',
        message: 'Are you sure you want to delete this leave application? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
                 // this.businessData.deleteLeave(leaveId).subscribe({
                   // TODO: Implement delete functionality in business service
         this.snackBar.open('Delete functionality not yet implemented', 'Close', {
           duration: 3000,
           panelClass: ['info-snackbar']
         });
      }
    });
  }

  // Navigation methods
  onProfile(): void {
    this.dialog.open(ProfileComponent, {
      width: '600px',
    });
  }

  onView(): void {
    this.route.navigate(['dashboard']);
  }

  onLeaveApplication(): void {
    this.businessData.onNavigate('leave-application');
  }

  onEmpDashboard(): void {
    this.businessData.onNavigate('emp-dashboard');
  }

  onLogout(): void {
    this.dialog.open(AlertBoxComponent, {
      data: { type: 'alert' }
    });
  }

  onAdd(): void {
    this.businessData.onNavigate('home');
  }

  onLeaveManagement(): void {
    this.businessData.onNavigate('leave-management');
  }

  onAdminDashboard(): void {
    this.businessData.onNavigate('admin-dashboard');
  }

  onPendingApprovals(): void {
    this.businessData.onNavigate('pending-approvals');
  }

  // Toggle employees view
  toggleEmployeesView(): void {
    this.showEmployees = !this.showEmployees;
    
    if (this.showEmployees && !this.isEmployeesLoaded) {
      this.loadEmployees();
    }
  }

  loadEmployees(): void {
    this.businessData.getAllEmployees().subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.employees = res.data;
          
          // Get employee leave status
          this.employees.forEach(employee => {
            this.getEmployeeLeaveStatus(employee.gmail);
          });
          
          this.isEmployeesLoaded = true;
        }
      },
      error: (err: any) => {
        console.error('Error loading employees:', err);
      }
    });
  }

  getEmployeeLeaveStatus(email: string): void {
    this.businessData.getLeavesByEmployeeId(email).subscribe({
      next: (res: any) => {
        if (res?.data && res.data.length > 0) {
          // Get most recent leave application
          const recentLeave = res.data.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          
          this.employeeLeaveStatus[email] = recentLeave.status;
        } else {
          this.employeeLeaveStatus[email] = 'No applications';
        }
      },
      error: (err: any) => {
        console.error('Error loading employees:', err);
      }
    });
  }

  private setupLayoutConfig() {
    const userRole = localStorage.getItem('role') || 'employee';
    
    const employeeNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.onProfile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Leave Application', icon: 'event_note', action: () => this.onLeaveApplication(), isActive: () => false },
      { label: 'Leave Dashboard', icon: 'dashboard', action: () => this.onEmpDashboard(), isActive: () => true },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    const adminNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.onProfile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Pending Approvals', icon: 'approval', action: () => this.onPendingApprovals(), isActive: () => false },
      { label: 'Employee Leaves', icon: 'assignment', action: () => this.onLeaveManagement(), isActive: () => false },
      { label: 'Admin Dashboard', icon: 'dashboard', action: () => this.onAdminDashboard(), isActive: () => false },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    const managerNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.onProfile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Leave Dashboard', icon: 'dashboard', action: () => this.onEmpDashboard(), isActive: () => true },
      { label: 'Leave Application', icon: 'event_note', action: () => this.onLeaveApplication(), isActive: () => false },
      { label: 'Manage Employee Leaves', icon: 'assignment', action: () => this.onLeaveManagement(), isActive: () => false },
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
}
