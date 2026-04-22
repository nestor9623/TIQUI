import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    TestBed.overrideComponent(Dashboard, {
      set: {
        template: '<section class="dashboard-test"></section>',
      },
    });

    await TestBed.configureTestingModule({
      imports: [Dashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
