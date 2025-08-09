import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from 'src/app/shared/alert-box/alert-box.component';
import { ProfileComponent } from '../shared/profile/profile.component';
import { LayoutConfig } from 'src/app/shared/layout/layout.interface';

export interface Employee {
  name: string;
  gmail: string;
  status: string;
  userId?: string;
  role?: string;
  mobile?: string;
  id?: string;
  _id?: string;
  managerId?: {
    _id: string;
    name: string;
    gmail: string;
  };
  selectedManagerId?: string; // Add this for tracking individual manager selections
}

export interface LeaveApplication {
  leaveId: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  emailId: string;
  startDate: string;
  totalDays: string;
  endDate: string;
  status: string;
  reason: string;
  isStartHalfDay?: boolean;
  startHalfDayType?: string;
  isEndHalfDay?: boolean;
  endHalfDayType?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  layoutConfig!: LayoutConfig;
  
  // Pending Employees
  pendingEmployees: Employee[] = [];
  paginatedEmployees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  pendingPageIndex = 0;
  pendingPageSize = 5;

  // All Employees
  allEmployees: Employee[] = [];
  filteredAllEmployees: Employee[] = [];
  paginatedAllEmployees: Employee[] = [];
  allEmpPageIndex = 0;
  allEmpPageSize = 10;

  // Table columns for different sections
  earthfitColumns: string[] = ['srNo', 'name', 'userRole', 'gmail', 'manager', 'status', 'action'];
  pendingColumns: string[] = ['srNo', 'name', 'userRole', 'gmail', 'status', 'action'];
  displayedColumns: string[] = ['sr', 'name', 'gmail', 'status', 'action'];

  // Manager assignment properties
  managers: Employee[] = [];


  
  // Make Math available in template
  Math = Math;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private route: Router,
    private snackBar: MatSnackBar,
    private businessData: BusinessDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchPendingEmployees();
    this.fetchAllEmployees();
    this.fetchManagers();
    this.setupLayoutConfig();
  }

  // Fetch Pending Employees
  fetchPendingEmployees() {
    this.businessData.getAllEmployees().subscribe({
      next: (res: any) => {
        const all = res.data || [];
        // ✅ Reset before filtering
        this.pendingEmployees = all.filter((e: any) => e.status === 'pending');
        // Initialize filtered employees with all pending employees
        this.filteredEmployees = [...this.pendingEmployees];
        this.pendingPageIndex = 0; // optional: reset pagination
        this.updatePaginatedEmployees();
      },
      error: (err) => {
        console.error('Error fetching employees:', err);
        this.showErrorMessage('Error fetching pending employees');
      }
    });
  }

  updatePaginatedEmployees() {
    const start = this.pendingPageIndex * this.pendingPageSize;
    const end = start + this.pendingPageSize;
    this.paginatedEmployees = this.filteredEmployees.slice(start, end);
  }

  pageChangePending(event: PageEvent) {
    this.pendingPageIndex = event.pageIndex;
    this.pendingPageSize = event.pageSize;
    this.updatePaginatedEmployees();
  }

  // Fetch All Employees
  fetchAllEmployees() {
    this.businessData.getAllEmployees().subscribe({
      next: (res: any) => {
        this.allEmployees = res.data || [];
        // Enhance employee data with default values for EarthFit design
        this.allEmployees = this.allEmployees.map((emp: any, index: number) => ({
          ...emp,
          userId: emp.userId || '101',
          role: emp.role || this.getRandomRole(),
          mobile: emp.mobile || '+91 9876543210'
        }));
        this.filteredAllEmployees = [...this.allEmployees];
        this.updatePaginatedAllEmployees();
      },
      error: (err) => {
        console.error('Error fetching all employees:', err);
        this.showErrorMessage('Error fetching all employees');
      }
    });
  }

  updatePaginatedAllEmployees() {
    const start = this.allEmpPageIndex * this.allEmpPageSize;
    const end = start + this.allEmpPageSize;
    this.paginatedAllEmployees = this.filteredAllEmployees.slice(start, end);
  }

  pageChangeAllEmp(event: PageEvent) {
    this.allEmpPageIndex = event.pageIndex;
    this.allEmpPageSize = event.pageSize;
    this.updatePaginatedAllEmployees();
  }

    // Search/Filter functionality
  applyAllEmployeeFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    
    if (!filterValue) {
      this.filteredAllEmployees = [...this.allEmployees];
    } else {
      this.filteredAllEmployees = this.allEmployees.filter(emp => 
        emp.name.toLowerCase().includes(filterValue) || 
        emp.gmail.toLowerCase().includes(filterValue)
      );
    }
    
    this.allEmpPageIndex = 0;
    this.updatePaginatedAllEmployees();
  }

  // Helper method to reapply current search filter
  reapplyCurrentFilter(): void {
    // Get current search input value
    const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
    if (searchInput) {
      const filterValue = searchInput.value.trim().toLowerCase();
      
      if (!filterValue) {
        this.filteredAllEmployees = [...this.allEmployees];
      } else {
        this.filteredAllEmployees = this.allEmployees.filter(emp => 
          emp.name.toLowerCase().includes(filterValue) || 
          emp.gmail.toLowerCase().includes(filterValue)
        );
      }
    } else {
      // No filter applied, show all employees
      this.filteredAllEmployees = [...this.allEmployees];
    }
  }

  // Pending Employees Search/Filter functionality
  applyPendingEmployeeFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    
    if (!filterValue) {
      this.filteredEmployees = [...this.pendingEmployees];
    } else {
      this.filteredEmployees = this.pendingEmployees.filter(emp => 
        emp.name.toLowerCase().includes(filterValue) || 
        emp.gmail.toLowerCase().includes(filterValue)
      );
    }
    
    this.pendingPageIndex = 0;
    this.updatePaginatedEmployees();
  }

  // Employee approval/rejection
  approveEmployee(gmail: string) {
    this.businessData.approveEmployeeByGmail(gmail).subscribe({
      next: () => {
        // Find the employee in pending list
        const pendingEmpIndex = this.pendingEmployees.findIndex(e => e.gmail === gmail);
        let approvedEmployee = null;

        if (pendingEmpIndex !== -1) {
          // Get the employee before removing
          approvedEmployee = { ...this.pendingEmployees[pendingEmpIndex] };
          approvedEmployee.status = 'approved';

          // Remove from pending employees
          this.pendingEmployees.splice(pendingEmpIndex, 1);
          
          // Update filtered employees (remove from pending)
          const filteredIndex = this.filteredEmployees.findIndex(e => e.gmail === gmail);
          if (filteredIndex !== -1) {
            this.filteredEmployees.splice(filteredIndex, 1);
          }
        }

        // Check if employee exists in all employees, if not add them
        const allEmpIndex = this.allEmployees.findIndex(e => e.gmail === gmail);
        if (allEmpIndex !== -1) {
          // Update existing employee status
          this.allEmployees[allEmpIndex].status = 'approved';
        } else if (approvedEmployee) {
          // Add the approved employee to all employees list
          this.allEmployees.push(approvedEmployee);
        }

        // Reapply current search filter to include the newly approved employee
        this.reapplyCurrentFilter();

        // Reset pagination to show the newly approved employee
        this.allEmpPageIndex = 0;

        // Update both paginated lists
        this.updatePaginatedEmployees();
        this.updatePaginatedAllEmployees();
        
        // Force change detection to update the UI immediately
        this.cdr.detectChanges();
        
        console.log('Employee approved and added to all employees:', approvedEmployee);
        console.log('Total all employees count:', this.allEmployees.length);
        console.log('Filtered all employees count:', this.filteredAllEmployees.length);
        
        this.showSuccessMessage('Employee approved successfully');
      },
      error: () => {
        this.showErrorMessage('Error approving employee');
      }
    });
  }

  rejectEmployee(gmail: string) {
    this.businessData.rejectEmployeeByGmail(gmail).subscribe({
      next: () => {
        // Find the employee in pending list
        const pendingEmpIndex = this.pendingEmployees.findIndex(e => e.gmail === gmail);
        let rejectedEmployee = null;

        if (pendingEmpIndex !== -1) {
          // Get the employee before removing
          rejectedEmployee = { ...this.pendingEmployees[pendingEmpIndex] };
          rejectedEmployee.status = 'rejected';

          // Remove from pending employees
          this.pendingEmployees.splice(pendingEmpIndex, 1);
          
          // Update filtered employees (remove from pending)
          const filteredIndex = this.filteredEmployees.findIndex(e => e.gmail === gmail);
          if (filteredIndex !== -1) {
            this.filteredEmployees.splice(filteredIndex, 1);
          }
        }

        // Check if employee exists in all employees, if not add them
        const allEmpIndex = this.allEmployees.findIndex(e => e.gmail === gmail);
        if (allEmpIndex !== -1) {
          // Update existing employee status
          this.allEmployees[allEmpIndex].status = 'rejected';
        } else if (rejectedEmployee) {
          // Add the rejected employee to all employees list
          this.allEmployees.push(rejectedEmployee);
        }

        // Reapply current search filter to include the newly rejected employee
        this.reapplyCurrentFilter();

        // Reset pagination to show the newly rejected employee
        this.allEmpPageIndex = 0;

        // Update both paginated lists
        this.updatePaginatedEmployees();
        this.updatePaginatedAllEmployees();
        
        // Force change detection to update the UI immediately
        this.cdr.detectChanges();
        
        console.log('Employee rejected and added to all employees:', rejectedEmployee);
        console.log('Total all employees count:', this.allEmployees.length);
        console.log('Filtered all employees count:', this.filteredAllEmployees.length);
        
        this.showSuccessMessage('Employee rejected successfully');
      },
      error: () => {
        this.showErrorMessage('Error rejecting employee');
      }
    });
  }

  // Style helper methods for EarthFit design
  getRoleClass(role: string): string {
    switch (role) {
      case 'Role 1':
        return 'role-1';
      case 'Role 2':
        return 'role-2';
      case 'Role 3':
        return 'role-3';
      default:
        return 'role-1';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
        return 'active';
      case 'pending':
        return 'pending';
      case 'rejected':
        return 'rejected';
      default:
        return 'active';
    }
  }

  // Utility methods
  private getRandomRole(): string {
    const roles = ['Role 1', 'Role 2', 'Role 3'];
    return roles[Math.floor(Math.random() * roles.length)];
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  // Navigation methods
  onProfile(): void {
    this.dialog.open(ProfileComponent, {
      width: '600px',
    });
  }

  onLogout(): void {
    this.dialog.open(AlertBoxComponent, {
      data: { type: 'alert' }
    });
  }

  onLeaveApplication(): void {
    this.businessData.onNavigate('leave-management');
  }

  onEmpDashboard() {
    this.businessData.onNavigate('admin-dashboard');
  }

  onAdd() {
    this.businessData.onNavigate('home');
  }

  onView(): void {
    this.businessData.onNavigate('dashboard');
  }

  onLeaveManagement(): void {
    this.businessData.onNavigate('leave-management');
  }

  onPendingApprovals(): void {
    this.businessData.onNavigate('pending-approvals');
  }

  // New method for adding new user
  onNewUser(): void {
    // Add your new user logic here
    console.log('Add new user clicked');
    // Example: Open a dialog or navigate to add user page
    // this.route.navigate(['add-user']);
  }

  // Employee action methods
  onEditEmployee(employee: Employee): void {
    console.log('Edit employee:', employee);
    // Add your edit logic here
    // Example: Open edit dialog or navigate to edit page
  }

  onDeleteEmployee(employee: Employee): void {
    console.log('Delete employee:', employee);
    // Add your delete logic here
    // Example: Show confirmation dialog then delete
    const dialogRef = this.dialog.open(AlertBoxComponent, {
      data: { 
        type: 'confirm',
        message: `Are you sure you want to delete ${employee.name}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Call delete API
        // this.businessData.deleteEmployee(employee.gmail).subscribe(...)
      }
    });
  }

  // Refresh data
  refreshData(): void {
    this.fetchPendingEmployees();
    this.fetchAllEmployees();
  }

  // Get total count methods for display
  getTotalPendingCount(): number {
    return this.pendingEmployees.length;
  }

  getTotalEmployeeCount(): number {
    return this.filteredAllEmployees.length;
  }

  // Export functionality (optional)
  exportToCSV(): void {
    console.log('Export to CSV clicked');
    // Add your export logic here
  }

  // Bulk operations (optional)
  onBulkApprove(): void {
    console.log('Bulk approve clicked');
    // Add your bulk approve logic here
  }

  onBulkReject(): void {
    console.log('Bulk reject clicked');
    // Add your bulk reject logic here
  }

  // Fetch all managers
  fetchManagers(): void {
    this.businessData.getManagers().subscribe({
      next: (res: any) => {
        this.managers = res.data || [];
      },
      error: (err) => {
        console.error('Error fetching managers:', err);
        this.showErrorMessage('Error fetching managers');
      }
    });
  }

  // Assign employee to manager
  assignEmployeeToManager(employee: Employee, managerId: string): void {
    if (!managerId || !employee._id) {
      this.showErrorMessage('Please select a manager');
      return;
    }

    this.businessData.assignEmployeeToManager(employee._id, managerId).subscribe({
      next: (res: any) => {
        if (res.status) {
          // Update the employee in the local arrays
          const updatedEmployee = res.data;
          this.updateEmployeeInArrays(updatedEmployee);
          // Clear the selected manager ID after successful assignment
          employee.selectedManagerId = '';
          this.showSuccessMessage(`${employee.name} assigned to manager successfully`);
        }
      },
      error: (err) => {
        console.error('Error assigning manager:', err);
        this.showErrorMessage('Error assigning manager to employee');
      }
    });
  }

  // Remove manager from employee
  removeManagerFromEmployee(employee: Employee): void {
    if (!employee._id) {
      this.showErrorMessage('Invalid employee data');
      return;
    }

    this.businessData.removeManagerFromEmployee(employee._id).subscribe({
      next: (res: any) => {
        if (res.status) {
          // Update the employee in the local arrays
          const updatedEmployee = res.data;
          this.updateEmployeeInArrays(updatedEmployee);
          this.showSuccessMessage(`Manager removed from ${employee.name} successfully`);
        }
      },
      error: (err) => {
        console.error('Error removing manager:', err);
        this.showErrorMessage('Error removing manager from employee');
      }
    });
  }

  // Helper method to update employee in all arrays
  private updateEmployeeInArrays(updatedEmployee: Employee): void {
    // Update in allEmployees
    const allEmpIndex = this.allEmployees.findIndex(emp => emp._id === updatedEmployee._id);
    if (allEmpIndex !== -1) {
      this.allEmployees[allEmpIndex] = updatedEmployee;
    }

    // Update in filteredAllEmployees
    const filteredEmpIndex = this.filteredAllEmployees.findIndex(emp => emp._id === updatedEmployee._id);
    if (filteredEmpIndex !== -1) {
      this.filteredAllEmployees[filteredEmpIndex] = updatedEmployee;
    }

    // Update paginated employees
    this.updatePaginatedAllEmployees();
  }

  // Get manager name for display
  getManagerName(employee: Employee): string {
    return employee.managerId ? employee.managerId.name : 'Not Assigned';
  }

  // Check if employee has manager
  hasManager(employee: Employee): boolean {
    return !!employee.managerId;
  }

  private setupLayoutConfig() {
    const userRole = localStorage.getItem('role') || 'admin';
    
    const employeeNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.onProfile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Leave Application', icon: 'event_note', action: () => this.onLeaveApplication(), isActive: () => false },
      { label: 'Leave Dashboard', icon: 'dashboard', action: () => this.onEmpDashboard(), isActive: () => false },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    const adminNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.onProfile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Pending Approvals', icon: 'approval', action: () => this.onPendingApprovals(), isActive: () => false },
      { label: 'Employee Leaves', icon: 'assignment', action: () => this.onLeaveApplication(), isActive: () => false },
      { label: 'Admin Dashboard', icon: 'dashboard', action: () => this.onEmpDashboard(), isActive: () => true },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    const managerNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.onProfile(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Leave Dashboard', icon: 'dashboard', action: () => this.onEmpDashboard(), isActive: () => false },
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

  getInitials(name: string): string {
    if (!name) return 'N/A';
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
  }


}
