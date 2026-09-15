import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App navigation', () => {
  it('provides collection, favorites, and trade links on both layouts', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelectorAll('a[href="/favorites"]').length).toBe(2);
    expect(page.querySelectorAll('a[href="/trade"]').length).toBe(2);
    expect(page.querySelectorAll('router-outlet').length).toBe(1);
  });
});
