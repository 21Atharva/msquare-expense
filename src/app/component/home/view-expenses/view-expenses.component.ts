import {
  Component,
  OnInit,
  ViewChild,
  ViewChildren,
  QueryList,
  AfterViewInit,
} from '@angular/core';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ExpenseContent } from './view-expense.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/auth/auth.service';
import { ViewSingleComponent } from '../view-single/view-single.component';
import { ImagePreviewDialogComponent } from '../image-preview-dialog/image-preview-dialog.component';
import { ShowChartComponent } from '../show-chart/show-chart.component';

@Component({
  selector: 'app-view-expenses',
  templateUrl: './view-expenses.component.html',
  styleUrls: ['./view-expenses.component.scss'],
})
export class ViewExpensesComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChildren(MatPaginator) paginators!: QueryList<MatPaginator>;

  displayedColumns: string[] = [
    'name',
    'amount',
    'expense_date',
    'expense_category',
    'payment',
    'comment',
    'image',
    'download'
  ];
  userName: string = '';
userEmail: string = '';

  ELEMENT_DATA: ExpenseContent[] = [];
  userId: string = '';
  isLoading = true;
  isDelete = false;
  dataSource = new MatTableDataSource<ExpenseContent>();
  cards: any[] = [];
  allexpense: number = 0;
  count: number = 0;
  userRole: string = 'employee';

  adminData: any[] = [];
  pagedAdminData: any[] = [];
  pageSize = 3;
  pageIndex = 0;

  constructor(
    public businessData: BusinessDataService,
    public dialog: MatDialog,
    public http: HttpClient,
    public route: Router,
    public authServ: AuthService,
    public _snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = localStorage.getItem('Id');
    const role = localStorage.getItem('role');
     const name = localStorage.getItem('name');
  const email = localStorage.getItem('user_email');

    if (!id || id.length !== 24) {
      this._snackBar.open('Session expired!', '', { duration: 2000 });
      this.authServ.onLogout();
      return;
    }

    this.userId = id;
    this.userRole = role || 'employee';
      this.userName = name || '';
  this.userEmail = email || '';

    if (this.userRole === 'employee') {
      this.getAllExpense(this.userId);
    } else if (this.userRole === 'admin') {
      this.getAllExpensesForAdmin();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.paginators.forEach((paginator, index) => {
        if (this.adminData[index]) {
          this.adminData[index].dataSource.paginator = paginator;
        }
      });
    });
  }

  getImagePath(imagePath: string): string {
  // If the path already includes http:// or https://, return it as-is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  return `http://localhost:3000/${imagePath}`;
}


  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePagedData();
  }

  updatePagedData() {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedAdminData = this.adminData.slice(start, end);
  }

toBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject('Canvas not supported');
      }
    };
    img.onerror = reject;
  });
}


async downloadAllExpensesAsPDF() {
  const doc = new jsPDF();
  const logoBase64 = await this.getBase64ImageFromAssets('assets/image/msquare.png');

  const wrapper = document.createElement('div');
  wrapper.style.width = '1000px';

  // HTML structure with logo and table header
  wrapper.innerHTML = `
    <div style="font-family: Arial; padding: 10px;">
      <div style="text-align: center;">
        <img src="${logoBase64}" style="width: 160px; height: auto; margin-bottom: 10px;" />
        <h2 style="margin: 0;">Employee Expense Report</h2>
      </div>
      <p><strong>Employee:</strong> ${this.userEmail}</p>
      <hr style="margin: 10px 0;" />
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;" border="1">
        <thead style="background-color: #f0f0f0;">
          <tr>
            <th style="padding: 5px;">#</th>
            <th style="padding: 5px;">Name</th>
            <th style="padding: 5px;">Amount</th>
            <th style="padding: 5px;">Date</th>
            <th style="padding: 5px;">Category</th>
            <th style="padding: 5px;">Payment</th>
            <th style="padding: 5px;">Comment</th>
            <th style="padding: 5px;">Receipt</th>
          </tr>
        </thead>
        <tbody id="expense-body"></tbody>
      </table>
    </div>
  `;

  document.body.appendChild(wrapper);
  const tbody = wrapper.querySelector('#expense-body');

  for (let i = 0; i < this.ELEMENT_DATA.length; i++) {
    const e = this.ELEMENT_DATA[i];
    const receiptUrl = e.image ? this.getImagePath(e.image) : '';
    let base64Img = '';

    if (receiptUrl) {
      try {
        base64Img = await this.toBase64(receiptUrl);
      } catch (err) {
        console.warn('Failed to convert image:', err);
      }
    }

    // Expense row
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="padding: 5px;">${i + 1}</td>
      <td style="padding: 5px;">${e.name}</td>
      <td style="padding: 5px;">₹${e.amount}</td>
      <td style="padding: 5px;">${e.expense_date}</td>
      <td style="padding: 5px;">${e.expense_category}</td>
      <td style="padding: 5px;">${e.payment}</td>
      <td style="padding: 5px;">${e.comment || '-'}</td>
      <td style="padding: 5px; text-align: center;">
        ${base64Img ? `<img src="${base64Img}" style="width: 70px; height: auto; border-radius: 4px;" />` : 'No Image'}
      </td>
    `;
    tbody?.appendChild(row);

    // Horizontal separator after each row (visually clean)
    const separator = document.createElement('tr');
    separator.innerHTML = `
      <td colspan="8" style="padding: 0;">
        <div style="height: 1px; background-color: #ccc; margin: 4px 0;"></div>
      </td>
    `;
    tbody?.appendChild(separator);
  }

  // Convert the whole wrapper to canvas and add to PDF
  const canvas = await html2canvas(wrapper, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const imgProps = doc.getImageProperties(imgData);
  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  doc.save(`Expense_Report_${this.userEmail || 'User'}.pdf`);

  document.body.removeChild(wrapper);
}


async downloadSingleExpenseAsPDF(expense: ExpenseContent) {
  const doc = new jsPDF();
  const logoBase64 = await this.getBase64ImageFromAssets('assets/image/msquare.png');

  const wrapper = document.createElement('div');
  wrapper.style.width = '1000px';

  const receiptUrl = expense.image ? this.getImagePath(expense.image) : '';
  let base64Img = '';

  if (receiptUrl) {
    try {
      base64Img = await this.toBase64(receiptUrl);
    } catch (err) {
      console.warn('Failed to convert image:', err);
    }
  }

  wrapper.innerHTML = `
    <div style="font-family: Arial; padding: 10px;">
      <div style="text-align: center;">
        <img src="${logoBase64}" style="width: 160px; height: auto; margin-bottom: 10px;" />
        <h2 style="margin: 0;">Employee Expense Report</h2>
      </div>
      <p><strong>Employee:</strong> ${this.userEmail}</p>
      <hr style="margin: 10px 0;" />
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;" border="1">
        <thead style="background-color: #f0f0f0;">
          <tr>
            <th style="padding: 5px;">Name</th>
            <th style="padding: 5px;">Amount</th>
            <th style="padding: 5px;">Date</th>
            <th style="padding: 5px;">Category</th>
            <th style="padding: 5px;">Payment</th>
            <th style="padding: 5px;">Comment</th>
            <th style="padding: 5px;">Receipt</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 5px;">${expense.name}</td>
            <td style="padding: 5px;">₹${expense.amount}</td>
            <td style="padding: 5px;">${expense.expense_date}</td>
            <td style="padding: 5px;">${expense.expense_category}</td>
            <td style="padding: 5px;">${expense.payment}</td>
            <td style="padding: 5px;">${expense.comment || '-'}</td>
            <td style="padding: 5px; text-align: center;">
              ${base64Img ? `<img src="${base64Img}" style="width: 70px;" />` : 'No Image'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  document.body.appendChild(wrapper);

  const canvas = await html2canvas(wrapper, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const imgProps = doc.getImageProperties(imgData);
  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  doc.save(`Expense_${expense.name}_${this.userEmail || 'User'}.pdf`);

  document.body.removeChild(wrapper);
}


async downloadAdminExpensePDF(group: any) {
  const doc = new jsPDF();
  const logoBase64 = await this.getBase64ImageFromAssets('assets/image/msquare.png');

  // Create temporary DOM structure
  const wrapper = document.createElement('div');
  wrapper.style.width = '1000px';

  wrapper.innerHTML = `
    <div style="font-family: Arial; padding: 10px;">
      <div style="text-align: center;">
        <img src="${logoBase64}" style="width: 160px; height: auto; margin-bottom: 10px;" />
        <h2 style="margin: 0;">Employee Expense Report</h2>
      </div>
<p><strong>Employee:</strong> ${group.gmail || '-'}</p>

      <hr style="margin: 10px 0;" />
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;" border="1">
        <thead style="background-color: #f0f0f0;">
          <tr>
            <th style="padding: 5px;">#</th>
            <th style="padding: 5px;">Name</th>
            <th style="padding: 5px;">Amount</th>
            <th style="padding: 5px;">Date</th>
            <th style="padding: 5px;">Category</th>
            <th style="padding: 5px;">Payment</th>
            <th style="padding: 5px;">Comment</th>
            <th style="padding: 5px;">Receipt</th>
          </tr>
        </thead>
        <tbody id="admin-expense-body"></tbody>
      </table>
    </div>
  `;

  document.body.appendChild(wrapper);
  const tbody = wrapper.querySelector('#admin-expense-body');

  for (let i = 0; i < group.expenses.length; i++) {
    const e = group.expenses[i];
  const receiptUrl = e.image ? this.getFullImageUrl(e.image) : '';
    let base64Img = '';

    if (receiptUrl) {
      try {
        base64Img = await this.getBase64ImageFromURL(receiptUrl);
      } catch (err) {
        console.warn('Failed to convert image:', err);
      }
    }

    // Create expense row
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="padding: 5px;">${i + 1}</td>
      <td style="padding: 5px;">${e.name}</td>
      <td style="padding: 5px;">₹${e.amount}</td>
      <td style="padding: 5px;">${e.expense_date}</td>
      <td style="padding: 5px;">${e.expense_category}</td>
      <td style="padding: 5px;">${e.payment}</td>
      <td style="padding: 5px;">${e.comment || '-'}</td>
      <td style="padding: 5px; text-align: center;">
        ${base64Img ? `<img src="${base64Img}" style="width: 70px; height: auto; border-radius: 4px;" />` : 'No Image'}
      </td>
    `;
    tbody?.appendChild(row);

    // Optional row separator for clarity
    const separator = document.createElement('tr');
    separator.innerHTML = `
      <td colspan="8" style="padding: 0;">
        <div style="height: 1px; background-color: #ccc; margin: 4px 0;"></div>
      </td>
    `;
    tbody?.appendChild(separator);
  }

  // Convert the HTML to canvas
  const canvas = await html2canvas(wrapper, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const imgProps = doc.getImageProperties(imgData);
  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  doc.save(`${group.gmail || 'user'}_Expenses_Report.pdf`);

  // Clean up
  document.body.removeChild(wrapper);
}


getFullImageUrl(path: string): string {
  const baseUrl = 'http://localhost:3000/'; // 👈 Replace with your backend server URL if different
  return `${baseUrl}${path}`;
}



getBase64ImageFromURL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = error => reject(error);
  });
}





  getAllExpensesForAdmin() {
    this.businessData.getAllGroupedExpenses().subscribe({
      next: (res: any) => {
        this.adminData = res.data.map((group: any) => {
          return {
            ...group,
            totalAmount: this.calculateTotalAmount(group.expenses),
            dataSource: new MatTableDataSource(group.expenses),
          };
        });

        this.updatePagedData();

        const allExpenses = this.adminData.flatMap((group) => group.expenses);
        this.createCardsForAdmin(allExpenses);
        this.pieChartData(allExpenses);
        this.onBarChartEdit(allExpenses);
        this.isLoading = false;
      },
      error: () => {
        this._snackBar.open('Session expired!', '', { duration: 2000 });
        this.authServ.onLogout();
      },
    });
  }

  getBase64ImageFromAssets(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = path;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject('Canvas not supported');
      }
    };
    img.onerror = reject;
  });
}



  calculateTotalAmount(data: any[]): number {
    return data.reduce((sum, curr) => sum + curr.amount, 0);
  }

  createCardsForAdmin(data: any[]) {
    const len = data.length;
    if (len === 0) {
      this.cards = [
        { icon: 'today', title: 'First Expense Date', content: '-' },
        { icon: 'today', title: 'Latest Expense Date', content: '-' },
        { icon: 'numbers', title: 'Number of Expenses', content: 0 },
        { icon: 'monetization_on', title: 'Total Amount', content: '₹0' },
      ];
      return;
    }

    data.sort(
      (a, b) =>
        new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime()
    );

    this.cards = [
      { icon: 'today', title: 'First Expense Date', content: data[0].expense_date },
      {
        icon: 'today',
        title: 'Latest Expense Date',
        content: data[len - 1].expense_date,
      },
      { icon: 'numbers', title: 'Number of Expenses', content: len },
      {
        icon: 'monetization_on',
        title: 'Total Amount',
        content: '₹' + this.calculateTotalAmount(data),
      },
    ];
  }

  getAllExpense(id: string) {
    this.businessData.onGetAllExpense(id).subscribe(
      (res: any) => {
        this.ELEMENT_DATA = res.data;
        this.dataSource = new MatTableDataSource<ExpenseContent>(this.ELEMENT_DATA);

        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
        }, 1000);

        const len = res.data.length;
        this.cards = [
          {
            icon: 'today',
            title: 'First Expense Date',
            content: len > 0 ? res.data[0].expense_date : '-',
          },
          {
            icon: 'today',
            title: 'Latest Expense Date',
            content: len > 0 ? res.data[len - 1].expense_date : '-',
          },
          { icon: 'numbers', title: 'Number of Expenses', content: len },
          { icon: 'monetization_on', title: 'Total Amount', content: '₹' + this.count },
        ];

        this.allexpense = len;
        this.businessData.expensesLogged = this.allexpense;
        this.updateExpene();
        this.pieChartData(res.data);
        this.onBarChartEdit(res.data);
        this.isLoading = false;
      },
      () => {
        this._snackBar.open('Session Expired!', '', { duration: 2000 });
        this.authServ.onLogout();
      }
    );
  }

  updateExpene() {
    const body = {
      expenseLogged: this.businessData.expensesLogged || 0,
    };
    this.authServ.updateUserData(this.userId, body);
  }

  pieChartData(data: any[]) {
    this.businessData.pieLabels = [];
    this.businessData.piedata = [];
    this.hashMap = {};
    this.count = 0;

    for (let expense of data) {
      const category = expense.expense_category;
      const amount = expense.amount;
      if (!this.hashMap[category]) {
        this.hashMap[category] = 0;
      }
      this.hashMap[category] += amount;
    }

    for (let key in this.hashMap) {
      if (this.hashMap[key] > 0) {
        this.businessData.pieLabels.push(key);
        this.businessData.piedata.push(this.hashMap[key]);
        this.count += this.hashMap[key];
      }
    }

    this.cards[3].content = '₹' + this.count;
  }

  openPieChart() {
    this.businessData.chartType = 'pie';
    this.businessData.pieDialogRef = this.dialog.open(ShowChartComponent, {
      width: '500px',
      height: '400px',
    });
  }

  onBarChartEdit(data: any[]) {
    let hashmap: any = {};
    for (let expense of data) {
      let date = expense.expense_date.toString().split(' ');
      hashmap[date[3]] = hashmap[date[3]] || [];
      hashmap[date[3]].push([date[1], expense.amount]);
    }
    this.businessData.hashmap = hashmap;
  }

  getTotal(expenses: any[]) {
    return expenses.reduce((total, exp) => total + exp.amount, 0);
  }

  openBarChart() {
    this.businessData.chartType = 'bar';
    this.dialog.open(ShowChartComponent, {
      width: '700px',
      height: '450px',
    });
  }

  openImageDialog(imageUrl: string): void {
    this.dialog.open(ImagePreviewDialogComponent, {
      data: { imageUrl },
      width: '600px'
    });
  }

  onOpen(element: any) {
    this.openDialog();
    this.businessData.data = {
      action: 'edit',
      data: element,
    };
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(Confirm, {
      width: '300px',
      height: '190px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.getAllExpense(this.userId);
      }
    });
  }

  onAdd() {
    this.businessData.onNavigate('home');
  }

  cate: any;
  hashMap: any = {};
}

@Component({
  selector: 'confirm',
  templateUrl: 'confirm.html',
})
export class Confirm {
  constructor(
    public dialogRef: MatDialogRef<Confirm>,
    public dialog: MatDialog,
    public businessData: BusinessDataService,
    public route: Router,
    public _snackBar: MatSnackBar
  ) {}

  onOpen() {
    this.route.navigate(['edit', this.businessData.data.data._id]);
  }

  onDelete() {
    this.businessData
      .onDeleteExpense(this.businessData.data.data._id)
      .subscribe((res: any) => {
        this._snackBar.open(res.message, '', { duration: 2000 });
      });
  }

  onView() {
    this.dialog.open(ViewSingleComponent, {
      width: '300px',
      height: '250px',
    });
  }
}
