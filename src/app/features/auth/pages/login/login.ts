import { CommonModule } from '@angular/common';
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

  readonly demoAccounts: DemoAccount[] = [
    { label: 'Admin', email: 'admin@mail.com', role: 'ADMIN' },
    { label: 'Employee', email: 'employee@mail.com', role: 'EMPLOYEE' },
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
    this.loginForm.patchValue({ email: account.email, password: 'bebas dulu' });
    this.loginForm.markAsUntouched();
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const { email, rememberMe } = this.loginForm.getRawValue();

    // Simulate network request
    setTimeout(() => {
      const role = email === 'admin@mail.com' ? 'ADMIN' : 'EMPLOYEE';
      const name = role === 'ADMIN' ? 'Admin User' : 'Employee User';

      localStorage.setItem(
        'tasktracker-user',
        JSON.stringify({
          id: role === 'ADMIN' ? 1 : 2,
          name,
          email,
          role,
        }),
      );

      if (rememberMe) {
        localStorage.setItem('tasktracker-remembered-email', email ?? '');
      } else {
        localStorage.removeItem('tasktracker-remembered-email');
      }

      this.isLoading.set(false);
      this.router.navigate(['/dashboard']);
    }, 1200);
  }
}
