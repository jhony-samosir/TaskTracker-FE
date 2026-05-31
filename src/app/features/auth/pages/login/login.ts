import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

export interface DemoAccount {
  label: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  readonly demoAccounts: DemoAccount[] = [
    { label: 'Admin', email: 'admin@tasktracker.com', role: 'ADMIN' },
    { label: 'Employee', email: 'employee@tasktracker.com', role: 'EMPLOYEE' },
  ];

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  isDisabled = computed(() => this.loginForm.invalid || this.isLoading());

  fillDemo(account: DemoAccount) {
    this.loginForm.patchValue({ email: account.email, password: 'Pass1234.' });
    this.loginForm.markAsUntouched();
    this.errorMessage.set(null);
  }

  onSubmit() {
    this.errorMessage.set(null);
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const { email, password, rememberMe } = this.loginForm.getRawValue();

    this.authService.login({ email: email ?? '', password: password ?? '' }).subscribe({
      next: () => {
        if (rememberMe) {
          localStorage.setItem('tasktracker-remembered-email', email ?? '');
        } else {
          localStorage.removeItem('tasktracker-remembered-email');
        }

        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (error.error?.message) {
          this.errorMessage.set(error.error.message);
        } else {
          this.errorMessage.set('An error occurred during login. Please try again.');
        }
      },
    });
  }
}
