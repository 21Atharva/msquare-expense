import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { LeaveApplication } from '../admin-dashboard/admin-dashboard.component';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root',
})
export class BusinessDataService {
  isLogging: boolean = false;
  isChecking: boolean = false;
  hashmap: any = {};
  public pieDialogRef: any;
  pieLabels: any = [];
  piedata: any = [];
  chartType: any;
  expensesLogged: any = 0;
  latestLoginDate: any = '';
  firstLoginDate: any = '';
  keywords: any;
  data: any;
  apiUrl = environment.apiUrl;
  userId: any;
  appVersion: any;
  private comingSrc: any = 'Direct';

  constructor(private route: Router, public http: HttpClient) {}

  setComingSrc(val: any) {
    this.comingSrc = val;
  }

  getComingSrc() {
    return this.comingSrc;
  }

  getUserIdFromSS() {
   return localStorage.getItem('Id'); 
  }

  onHome() {
    this.route.navigate(['home']);
  }

  onNavigate(url: any) {
    this.route.navigate([url]);
  }

  onGetAllExpense(id: any) {
    this.userId = id;
    return this.http.get(this.apiUrl + 'GET_ALL_EXPENSE/' + id);
  }

  // business-data.service.ts
getAllGroupedExpenses() {
  return this.http.get(this.apiUrl + 'allEmpExpenses');
}

getSaveDataById(id: string): Observable<any> {
  return this.http.get(`${this.apiUrl}GET_SAVE_DATA/${id}`);
}



  onCreateExpense(values: any, date: any) {
    let id = this.getUserIdFromSS();
    let body = {
      projectId: values.projectId,
      projectName: values.projectName,
      name: values.name,
      amount: values.amount,
      expense_date: date[0] + ' ' + date[1] + ' ' + date[2] + ' ' + date[3],
      expense_category: values.expense_category,
      payment: values.payment,
      comment: values.comment,
      creater: id,
    };
    return this.http.post(this.apiUrl + 'CREATE_EXPENSE', body);
  }

  // ✅ New method for uploading expense with image
  onCreateExpenseWithImage(formData: FormData) {
    const userId = this.getUserIdFromSS();
    return this.http.post(`${this.apiUrl}CREATE_EXPENSE_WITH_IMAGE/${userId}`, formData);
  }

  onImportExpense(values: any) {
    let id = this.getUserIdFromSS();
    let date = values.expense_date.split('/');
    date = new Date(date[2], date[1] - 1, date[0]).toString().split(' ');
    let body = {
      name: values.expense_name,
      amount: values.amount,
      expense_date: date[0] + ' ' + date[1] + ' ' + date[2] + ' ' + date[3],
      expense_category: values.expense_category,
      payment: values.payment_type,
      comment: values.comment,
      creater: id,
    };
    return this.http.post(this.apiUrl + 'CREATE_EXPENSE', body);
  }

  onCreateCategory(body: any) {
    return this.http.post(this.apiUrl + 'SAVE_CATEGORY/' + this.userId, body);
  }

  onEditCategory(body: any) {
    return this.http.post(this.apiUrl + 'EDIT_CATEGORY/' + this.userId, body);
  }

  onDeleteExpense(id: string) {
    return this.http.delete(this.apiUrl + 'DELETE_EXPENSE/' + this.userId + '/' + id);
  }

  onGetSingleExpense(id: string) {
    return this.http.get(this.apiUrl + 'GET_SINGLE_EXPENSE/' + this.userId + '/' + id);
  }

  onUpdateExpense(id: string, values: any) {
    let str = values.expense_date.toString();
    let date = str.split(' ');
    let body = {
      name: values.name,
      amount: values.amount,
      expense_date: date[0] + ' ' + date[1] + ' ' + date[2] + ' ' + date[3],
      expense_category: values.expense_category,
      payment: values.payment,
      comment: values.comment,
      creater: this.userId,
    };
    return this.http.patch(this.apiUrl + 'UPDATE_EXPENSE/' + this.userId + '/' + id, body);
  }

onGetExpensesGroupedByEmail() {
  return this.http.get(this.apiUrl + 'allEmpExpenses/');
}


  onGetAllCategory() {
    this.userId = this.getUserIdFromSS();
    return this.http.get(this.apiUrl + 'GET_CATEGORY/' + this.userId);
  }




getManagers(): Observable<any> {
  return this.http.get(`${this.apiUrl}USER/managers`);
}

getEmployeesByDepartment(department: string): Observable<any> {
  return this.http.get(`${this.apiUrl}USER/employees/by-department?department=${department}`);
}



  onGithub() {
    const link = document.createElement('a');
    link.target = '_blank';
    link.click();
  }

  onLinkedin() {
    const link = document.createElement('a');
    link.target = '_blank';
    link.href = 'https://www.linkedin.com/in/atharva-gandhe-825237224/';
    link.click();
  }

  updateProfile(body: any) {
    return this.http.post(this.apiUrl + 'UPDATE_PROFILE/' + this.getUserIdFromSS(), body);
  }

updateWholeInfo(body: any, id: string) {
  return this.http.post(this.apiUrl + 'UPDATE_PROFILE/' + id, body);
}


  // getAllSaveData() {
  //   return this.http.get(this.apiUrl + 'GET_SAVE_DATA/' + this.getUserIdFromSS());
  // }

  applyLeave(formData: FormData): Observable<any> {
    const headers = new HttpHeaders();
    // Don't set Content-Type header for FormData, let browser handle it
    
    return this.http.post(`${this.apiUrl}/leaves`, formData, { headers });
  }


  getLeavesByEmployeeId(gmail: string) {
    return this.http.get<any>(`${this.apiUrl}leaves/by-email/${gmail}`);
  }

  getUserById(id: string) {
  return this.http.get<any>(`${this.apiUrl}USER/user/${id}`);
}

getLeavesByDepartment(department: string) {
  return this.http.get<any[]>(`${this.apiUrl}leaves/by-department/${department}`);
}


  private baseUrl = 'http://localhost:3000/v1/api/leave';

   getLeavesByManager(managerId: string) {
  return this.http.get<LeaveApplication[]>(`${this.apiUrl}/leaves/for-manager/${managerId}`);
}

  getAllLeaves() {
    return this.http.get<LeaveApplication[]>(`${this.baseUrl}`);
  }

  updateLeaveStatus(leaveId: string, status: string) {
    return this.http.patch<LeaveApplication>(`${this.apiUrl}/status/${leaveId}`, { status });
  }

 updateLeaveApplication(leaveId: string, updateFields: any): Observable<any> {
  return this.http.patch(`${this.apiUrl}leave/${leaveId}`, updateFields);
}

deleteLeaveApplication(leaveId: string): Observable<any> {
  return this.http.delete(`${this.apiUrl}leave/${leaveId}`);
}


  approveEmployeeByGmail(gmail: string) {
  return this.http.patch(`${this.apiUrl}USER/approve/${gmail}`, {});
}

rejectEmployeeByGmail(gmail: string) {
  return this.http.patch(`${this.apiUrl}USER/reject/${gmail}`, {});
}

getPendingEmployees() {
  return this.http.get(`${this.apiUrl}USER/pending`);
}

getAllEmployees() {
  return this.http.get<any>(`${this.apiUrl}USER/all-users`);
}



}
