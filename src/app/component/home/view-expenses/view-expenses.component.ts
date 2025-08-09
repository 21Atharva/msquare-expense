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
import * as XLSX from 'xlsx';
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

  // Date filter properties
  fromDate: Date | null = null;
  toDate: Date | null = null;
  filteredData: ExpenseContent[] = [];
  filteredAdminData: any[] = [];

  constructor(
    public businessData: BusinessDataService,
    public dialog: MatDialog,
    public http: HttpClient,
    public route: Router,
    public authServ: AuthService,
    public _snackBar: MatSnackBar
  ) {}

  getDisplayName(): string {
    if (this.userName && this.userEmail) {
      return `${this.userName} (${this.userEmail})`;
    } else if (this.userName) {
      return this.userName;
    } else if (this.userEmail) {
      return this.userEmail;
    } else {
      return 'User';
    }
  }

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

    if (this.userRole === 'employee' || this.userRole === 'manager') {
      this.getAllExpense(this.userId);
    } else if (this.userRole === 'admin') {
      this.getAllExpensesForAdmin();
    }
    
    // Initialize filtered data
    this.filteredData = this.ELEMENT_DATA;
    this.filteredAdminData = this.adminData;
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

  const dataToExport = this.filteredData.length > 0 ? this.filteredData : this.ELEMENT_DATA;
  for (let i = 0; i < dataToExport.length; i++) {
    const e = dataToExport[i];
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

// Excel Download Methods
downloadAllExpensesAsExcel() {
  const dataToExport = this.filteredData.length > 0 ? this.filteredData : this.ELEMENT_DATA;
  this.createMSquareExpenseReport(dataToExport, `Expense_Report_${this.userEmail || 'User'}.xlsx`);
}

downloadSingleExpenseAsExcel(expense: ExpenseContent) {
  this.createMSquareExpenseReport([expense], `Expense_${expense.name}_${this.userEmail || 'User'}.xlsx`);
}

createMSquareExpenseReport(expenses: ExpenseContent[], filename: string) {
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};
  
  // Get unique dates and sort them
  const uniqueDates = [...new Set(expenses.map(e => {
    const date = new Date(e.expense_date);
    return date.toLocaleDateString();
  }))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  // Group expenses by category and date
  const categoryDateAmounts: {[key: string]: {[key: string]: number}} = {};
  const categoryTotals: {[key: string]: number} = {};
  
  expenses.forEach(expense => {
    const category = expense.expense_category || 'Misc exp';
    const dateStr = new Date(expense.expense_date).toLocaleDateString();
    
    if (!categoryDateAmounts[category]) {
      categoryDateAmounts[category] = {};
    }
    
    categoryDateAmounts[category][dateStr] = (categoryDateAmounts[category][dateStr] || 0) + expense.amount;
    categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
  });
  
  // Calculate date range
  const fromDate = uniqueDates.length > 0 ? uniqueDates[0] : '';
  const toDate = uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : '';
  
  // Get unique project names as site names
  const projectNames = [...new Set(expenses.map(e => e.projectName).filter(name => name))];
  const siteNames = projectNames.length > 0 ? projectNames.join(', ') : '-';
  
  // Calculate total
  const grandTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Get current date
  const currentDate = new Date().toLocaleDateString();
  
  // Helper function to get category amount for a specific date
  const getCategoryAmountForDate = (categoryNames: string[], dateStr: string): number => {
    return categoryNames.reduce((sum, name) => {
      return sum + (categoryDateAmounts[name] && categoryDateAmounts[name][dateStr] ? categoryDateAmounts[name][dateStr] : 0);
    }, 0);
  };
  
  // Helper function to get category total with multiple possible category names
  const getCategoryTotal = (...categoryNames: string[]): number => {
    return categoryNames.reduce((sum, name) => sum + (categoryTotals[name] || 0), 0);
  };
  
  // Create dynamic header with actual dates
  const headerRow = ['Sr. N', 'Exp head'];
  uniqueDates.forEach(date => headerRow.push(date));
  while (headerRow.length < 8) headerRow.push(''); // Fill remaining columns
  headerRow.push('TOTAL');

  // Helper function to create category row with amounts for each date
  const createCategoryRow = (srNo: string, categoryName: string, ...categoryNames: string[]) => {
    const row = [srNo, categoryName];
    uniqueDates.forEach(date => {
      const amount = getCategoryAmountForDate(categoryNames.length > 0 ? categoryNames : [categoryName], date);
      row.push(amount ? amount.toString() : '');
    });
    while (row.length < 8) row.push(''); // Fill remaining columns
    const total = getCategoryTotal(...(categoryNames.length > 0 ? categoryNames : [categoryName]));
    row.push(total ? total.toString() : '');
    return row;
  };

  // Create the M Square Engineers format with individual dates
  const data: any[][] = [
    [], // Empty row
    ['M Square Engineers'], // Company name
    [], // Empty row
    ['Name: ' + this.getDisplayName(), '', '', '', '', '', 'Date: ' + currentDate],
    ['Site: ' + siteNames, '', '', '', '', '', ''],
    [], // Empty row
    ['', '', '', '', '', '', '::: Date:::'],
    [], // Empty row
    ['Visit'], 
    ['No of persons'],
    headerRow,
    createCategoryRow('1', 'Travelling'),
    createCategoryRow('2', 'Conveyance'),
    createCategoryRow('3', 'Food allowance', 'Food allowance', 'Food', 'Meals'),
    createCategoryRow('4', 'Printing and stationery', 'Printing and Stationary', 'Printing', 'Stationery'),
    createCategoryRow('5', 'Telephone exp', 'Telephone', 'Communication', 'Phone'),
    createCategoryRow('6', 'Medical exp', 'Medical Exp', 'Medical', 'Healthcare'),
    createCategoryRow('7', 'Pur. Of tools & tackles', 'Tools', 'Equipment'),
    createCategoryRow('8', 'Pur. Of consumables', 'Consumables', 'Supplies'),
    createCategoryRow('9', 'Lodging exp', 'Lodging Exp', 'Lodging', 'Accommodation', 'Hotel'),
    createCategoryRow('10', 'Advance given', 'Advance'),
    createCategoryRow('11', 'Misc exp', 'Laundry', 'Miscellaneous', 'Others', 'Misc'),
    ['12', '', '', '', '', '', '', '', ''],
    ['13', '', '', '', '', '', '', '', ''],
    ['14', '', '', '', '', '', '', '', ''],
    ['15', '', '', '', '', '', '', '', ''],
    [], // Empty row
    ['', '', '', '', '', '', '', 'TOTAL', grandTotal.toString()]
  ];
  
  // Add data to worksheet
  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      ws[cellAddress] = { v: cell, t: typeof cell === 'number' ? 'n' : 's' };
    });
  });
  
  // Set range dynamically based on actual columns used
  const maxCols = Math.max(...data.map(row => row.length));
  ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: maxCols - 1, r: data.length - 1 } });
  
  // Set column widths dynamically based on number of dates
  const columnWidths = [
    { wch: 8 },   // Sr. N
    { wch: 20 },  // Exp head
  ];
  
  // Add column width for each date
  uniqueDates.forEach(() => {
    columnWidths.push({ wch: 12 });
  });
  
  // Fill remaining columns if needed
  while (columnWidths.length < 8) {
    columnWidths.push({ wch: 12 });
  }
  
  // Add TOTAL column
  columnWidths.push({ wch: 15 });
  
  ws['!cols'] = columnWidths;
  
  // Style the header
  const headerStyle = {
    font: { bold: true, sz: 14 },
    alignment: { horizontal: 'center' }
  };
  
  if (ws['A2']) ws['A2'].s = headerStyle; // M Square Engineers
  
  XLSX.utils.book_append_sheet(wb, ws, 'Expense Report');
  XLSX.writeFile(wb, filename);
}

downloadAdminExpenseExcel(group: any) {
  // Temporarily set user data for the report
  const originalUserName = this.userName;
  const originalUserEmail = this.userEmail;
  
  this.userName = group.name || '';
  this.userEmail = group.gmail || '';
  
  this.createMSquareExpenseReport(group.expenses, `${group.gmail || 'user'}_Expenses_Report.xlsx`);
  
  // Restore original user data
  this.userName = originalUserName;
  this.userEmail = originalUserEmail;
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

        this.filteredAdminData = this.adminData;
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
        this.filteredData = this.ELEMENT_DATA;
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
      // Add null/undefined checks for required fields
      if (!expense.expense_category || expense.amount === undefined || expense.amount === null) {
        console.warn('Skipping expense with missing category or amount:', expense);
        continue;
      }
      
      const category = expense.expense_category;
      const amount = parseFloat(expense.amount) || 0; // Ensure amount is a number
      
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

    if (this.cards && this.cards[3]) {
      this.cards[3].content = '₹' + this.count;
    }
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
      // Add null/undefined checks for expense_date and amount
      if (!expense.expense_date || !expense.amount) {
        console.warn('Skipping expense with missing date or amount:', expense);
        continue;
      }
      
      try {
        let date = expense.expense_date.toString().split(' ');
        if (date.length >= 4) { // Ensure we have at least 4 parts (day, month, date, year)
          hashmap[date[3]] = hashmap[date[3]] || [];
          hashmap[date[3]].push([date[1], expense.amount]);
        }
      } catch (error) {
        console.warn('Error processing expense date:', expense.expense_date, error);
      }
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

  // Date filter methods
  onDateFilterChange() {
    this.applyDateFilter();
  }

  applyDateFilter() {
    if (this.userRole === 'employee' || this.userRole === 'manager') {
      this.filteredData = this.filterExpensesByDate(this.ELEMENT_DATA);
      this.dataSource.data = this.filteredData;
    } else if (this.userRole === 'admin') {
      this.filteredAdminData = this.adminData.map(group => ({
        ...group,
        expenses: this.filterExpensesByDate(group.expenses),
        expenseCount: this.filterExpensesByDate(group.expenses).length
      }));
      this.updatePagedData();
    }
  }

  filterExpensesByDate(expenses: any[]): any[] {
    if (!this.fromDate && !this.toDate) {
      return expenses;
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date);
      
      // Reset time to start of day for accurate comparison
      if (this.fromDate) {
        const fromDate = new Date(this.fromDate);
        fromDate.setHours(0, 0, 0, 0);
        expenseDate.setHours(0, 0, 0, 0);
        
        if (this.toDate) {
          const toDate = new Date(this.toDate);
          toDate.setHours(23, 59, 59, 999);
          const expenseDateEnd = new Date(expense.expense_date);
          expenseDateEnd.setHours(23, 59, 59, 999);
          return expenseDate >= fromDate && expenseDateEnd <= toDate;
        } else {
          return expenseDate >= fromDate;
        }
      } else if (this.toDate) {
        const toDate = new Date(this.toDate);
        toDate.setHours(23, 59, 59, 999);
        expenseDate.setHours(23, 59, 59, 999);
        return expenseDate <= toDate;
      }
      return true;
    });
  }

  clearDateFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.applyDateFilter();
  }

  updatePagedData() {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    const dataToPage = this.filteredAdminData.length > 0 ? this.filteredAdminData : this.adminData;
    this.pagedAdminData = dataToPage.slice(start, end);
  }

  // Employee-specific download methods for admin view
  async downloadEmployeeExpensesAsPDF(group: any) {
    const doc = new jsPDF();
    const logoBase64 = await this.getBase64ImageFromAssets('assets/image/msquare.png');

    const wrapper = document.createElement('div');
    wrapper.style.width = '1000px';

    // HTML structure with logo and table header for specific employee
    wrapper.innerHTML = `
      <div style="font-family: Arial; padding: 10px;">
        <div style="text-align: center;">
          <img src="${logoBase64}" style="width: 160px; height: auto; margin-bottom: 10px;" />
          <h2 style="margin: 0;">Employee Expense Report</h2>
        </div>
        <p><strong>Employee:</strong> ${group.gmail || 'Unknown User'}</p>
        <p><strong>Total Expenses:</strong> ${group.expenses.length} | <strong>Total Amount:</strong> ₹${group.totalAmount}</p>
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

    const dataToExport = group.expenses;
    for (let i = 0; i < dataToExport.length; i++) {
      const e = dataToExport[i];
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

      // Horizontal separator after each row
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
    doc.save(`Expense_Report_${group.gmail || 'Employee'}.pdf`);

    // Clean up
    document.body.removeChild(wrapper);
  }

  downloadEmployeeExpensesAsExcel(group: any) {
    this.createMSquareExpenseReport(group.expenses, `Expense_Report_${group.gmail || 'Employee'}.xlsx`);
  }
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
