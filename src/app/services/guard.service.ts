import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root'
})
export class GuardService implements CanActivate {

  constructor(private login: LoginService,
              private router: Router) { }

  canActivate(): boolean {
    if(this.login.signedIn()){
      return true;
    } else {
      this.router.navigate(['']);
      return false;
    }
  }
}
