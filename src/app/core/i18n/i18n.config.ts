export type AppLocale = 'es' | 'en';

export interface LocaleOption {
  id: AppLocale;
  label: string;
  shortLabel: string;
}

export interface CommonTranslations {
  appName: string;
  actions: {
    login: string;
    logout: string;
    menu: string;
    assistant: string;
  };
  labels: {
    userFallback: string;
    appAlerts: string;
    closeAlert: string;
  };
  language: {
    label: string;
    spanish: string;
    english: string;
  };
  theme: {
    label: string;
    light: string;
    dark: string;
  };
}

export interface LoginFeatureItem {
  title: string;
  description: string;
}

export interface LoginTranslations {
  hero: {
    eyebrow: string;
    intro: string;
    titleLead: string;
    rotator: string[];
    subtitle: string;
    mapTitle: string;
    mapCaption: string;
    storyKicker: string;
    storyTitle: string;
    storyBody: string;
    features: LoginFeatureItem[];
  };
  form: {
    panelKicker: string;
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    submit: string;
    submitting: string;
    demoTitle: string;
    errors: {
      emailRequired: string;
      emailInvalid: string;
      passwordRequired: string;
      passwordMin: string;
      generic: string;
    };
  };
}

export interface NavbarTranslations {
  userMenu: string;
  companyName: string;
  pageFallback: string;
}

export interface ForgotPasswordTranslations {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: LoginFeatureItem[];
  };
  form: {
    back: string;
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successText: string;
    errors: {
      emailRequired: string;
      emailInvalid: string;
    };
  };
}

export interface ReportsTranslations {
  title: string;
  subtitle: string;
  filters: {
    dateRange: string;
    employee: string;
    status: string;
  };
}

export interface IncidentApprovalTranslations {
  emptyOpen: string;
  emptyActive: string;
  selectAll: string;
  selectedCountSingular: string;
  selectedCountPlural: string;
  approveSelected: string;
  approveOne: string;
  confirmCommentLabel: string;
  confirmCommentPlaceholder: string;
  confirmLabel: string;
  titleSingle: string;
  titleMultiple: string;
  messageSingle: string;
  messageMultiple: string;
  typeMissingCheckin: string;
  typePendingApproval: string;
}

export interface AssistantTranslations {
  eyebrow: string;
  triggerLabel: string;
  panel: {
    title: string;
    intro: string;
    queuePending: string;
    metrics: {
      dailyBalance: string;
      weeklyBalance: string;
      incidents: string;
    };
    plan: {
      suggestedStart: string;
      suggestedEnd: string;
      noAdjustment: string;
    };
    recommendations: {
      title: string;
      subtitle: string;
      clearInbox: string;
      markReviewed: string;
      remove: string;
    };
    empty: {
      title: string;
      description: string;
    };
    footer: {
      openDashboard: string;
      goToCheckins: string;
    };
    accessibility: {
      closeOverlay: string;
      closePanel: string;
      unreadCount: string;
    };
  };
  overview: {
    title: string;
    subtitle: string;
    actions: {
      openCheckins: string;
      viewDashboard: string;
    };
  };
  status: {
    inactive: string;
    pending: string;
    excess: string;
    adjust: string;
    closed: string;
    active: string;
  };
  fallback: {
    inactiveHeadline: string;
    inactiveSummary: string;
    noPendingHeadline: string;
    noPendingSummary: string;
  };
  alerts: {
    missingCheckin: {
      title: string;
      message: string;
      action: string;
    };
    suggestedEnd: {
      titleExceeded: string;
      titleAligned: string;
      messageExceeded: string;
      messageAligned: string;
      action: string;
    };
    suggestedStart: {
      titlePositive: string;
      titleNegative: string;
      messagePositive: string;
      messageNegative: string;
      action: string;
    };
    breakReminder: {
      title: string;
      message: string;
      action: string;
    };
    weeklyBalance: {
      titlePositive: string;
      titleNegative: string;
      messagePositive: string;
      messageNegative: string;
      action: string;
    };
    incidentsPending: {
      title: string;
      message: string;
      action: string;
    };
    balancedDay: {
      title: string;
      message: string;
      action: string;
    };
  };
}

export interface UsersTranslations {
  page: {
    kicker: string;
    title: string;
    subtitle: string;
    newUser: string;
    statsAriaLabel: string;
    stats: {
      total: string;
      active: string;
      inactive: string;
      admins: string;
    };
    filters: {
      title: string;
      subtitle: string;
      search: string;
      searchPlaceholder: string;
      role: string;
      status: string;
      all: string;
      active: string;
      inactive: string;
    };
    table: {
      title: string;
      subtitle: string;
      user: string;
      role: string;
      address: string;
      weeklyHours: string;
      status: string;
      actions: string;
      empty: string;
      hoursSuffix: string;
      noManager: string;
      active: string;
      inactive: string;
      tooltipActivate: string;
      tooltipDeactivate: string;
      tooltipEdit: string;
      tooltipDelete: string;
    };
  };
  modal: {
    kicker: string;
    createTitle: string;
    editTitle: string;
    subtitle: string;
    close: string;
    fields: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      role: string;
      area: string;
      address: string;
      community: string;
      weeklyHours: string;
      manager: string;
      active: string;
    };
    placeholders: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      area: string;
      address: string;
    };
    noManager: string;
    save: string;
    create: string;
    cancel: string;
  };
  roles: {
    admin: string;
    manager: string;
    employee: string;
  };
  communities: {
    madrid: string;
    galicia: string;
  };
  feedback: {
    editUser: string;
    selfDeactivateBlocked: string;
    selfDeleteBlocked: string;
    userUpdated: string;
    userCreated: string;
    userActivated: string;
    userDeactivated: string;
    userDeleted: string;
    editCancelled: string;
  };
  confirm: {
    defaultTitle: string;
    defaultMessage: string;
    defaultLabel: string;
    activateTitle: string;
    deactivateTitle: string;
    activateMessage: string;
    deactivateMessage: string;
    activateLabel: string;
    deactivateLabel: string;
    deleteTitle: string;
    deleteMessage: string;
    deleteLabel: string;
  };
}

export interface AlertsTranslations {
  assistant: {
    reviewedTitle: string;
    reviewedMessage: string;
    removedTitle: string;
    removedMessage: string;
    clearedTitle: string;
    clearedMessage: string;
  };
  users: {
    actionNotAllowedTitle: string;
  };
  checkins: {
    blockedTitle: string;
    approvedDayTitle: string;
    registeredTitle: string;
    registeredMessage: string;
    vacationBlockedMessage: string;
    weekendBlockedMessage: string;
    holidayBlockedMessage: string;
    approvedDayMessage: string;
  };
  incidents: {
    approvedSingleTitle: string;
    approvedMultipleTitle: string;
    approvedSingleMessage: string;
    approvedMultipleMessage: string;
    noteRegisteredMessage: string;
  };
}

export interface TranslationBundle {
  common: CommonTranslations;
  login: LoginTranslations;
  navbar: NavbarTranslations;
  forgotPassword: ForgotPasswordTranslations;
  reports: ReportsTranslations;
  incidentApproval: IncidentApprovalTranslations;
  assistant: AssistantTranslations;
  users: UsersTranslations;
  alerts: AlertsTranslations;
}

export const I18N_STORAGE_KEY = 'tiqui.locale';
export const DEFAULT_LOCALE: AppLocale = 'es';

export const LOCALE_OPTIONS: LocaleOption[] = [
  { id: 'es', label: 'Español', shortLabel: 'ES' },
  { id: 'en', label: 'English', shortLabel: 'EN' },
];

export function createEmptyTranslationBundle(): TranslationBundle {
  return {
    common: {
      appName: 'TiquiApp',
      actions: {
        login: '',
        logout: '',
        menu: '',
        assistant: '',
      },
      labels: {
        userFallback: '',
        appAlerts: '',
        closeAlert: '',
      },
      language: {
        label: '',
        spanish: '',
        english: '',
      },
      theme: {
        label: '',
        light: '',
        dark: '',
      },
    },
    login: {
      hero: {
        eyebrow: '',
        intro: '',
        titleLead: '',
        rotator: [],
        subtitle: '',
        mapTitle: '',
        mapCaption: '',
        storyKicker: '',
        storyTitle: '',
        storyBody: '',
        features: [],
      },
      form: {
        panelKicker: '',
        title: '',
        subtitle: '',
        emailLabel: '',
        emailPlaceholder: '',
        passwordLabel: '',
        passwordPlaceholder: '',
        forgotPassword: '',
        submit: '',
        submitting: '',
        demoTitle: '',
        errors: {
          emailRequired: '',
          emailInvalid: '',
          passwordRequired: '',
          passwordMin: '',
          generic: '',
        },
      },
    },
    navbar: {
      userMenu: '',
      companyName: 'GT Motive',
      pageFallback: '',
    },
    forgotPassword: {
      hero: {
        eyebrow: '',
        title: '',
        subtitle: '',
        steps: [],
      },
      form: {
        back: '',
        title: '',
        subtitle: '',
        emailLabel: '',
        emailPlaceholder: '',
        submit: '',
        submitting: '',
        successTitle: '',
        successText: '',
        errors: {
          emailRequired: '',
          emailInvalid: '',
        },
      },
    },
    reports: {
      title: '',
      subtitle: '',
      filters: {
        dateRange: '',
        employee: '',
        status: '',
      },
    },
    incidentApproval: {
      emptyOpen: '',
      emptyActive: '',
      selectAll: '',
      selectedCountSingular: '',
      selectedCountPlural: '',
      approveSelected: '',
      approveOne: '',
      confirmCommentLabel: '',
      confirmCommentPlaceholder: '',
      confirmLabel: '',
      titleSingle: '',
      titleMultiple: '',
      messageSingle: '',
      messageMultiple: '',
      typeMissingCheckin: '',
      typePendingApproval: '',
    },
    assistant: {
      eyebrow: '',
      triggerLabel: '',
      panel: {
        title: '',
        intro: '',
        queuePending: '',
        metrics: {
          dailyBalance: '',
          weeklyBalance: '',
          incidents: '',
        },
        plan: {
          suggestedStart: '',
          suggestedEnd: '',
          noAdjustment: '',
        },
        recommendations: {
          title: '',
          subtitle: '',
          clearInbox: '',
          markReviewed: '',
          remove: '',
        },
        empty: {
          title: '',
          description: '',
        },
        footer: {
          openDashboard: '',
          goToCheckins: '',
        },
        accessibility: {
          closeOverlay: '',
          closePanel: '',
          unreadCount: '',
        },
      },
      overview: {
        title: '',
        subtitle: '',
        actions: {
          openCheckins: '',
          viewDashboard: '',
        },
      },
      status: {
        inactive: '',
        pending: '',
        excess: '',
        adjust: '',
        closed: '',
        active: '',
      },
      fallback: {
        inactiveHeadline: '',
        inactiveSummary: '',
        noPendingHeadline: '',
        noPendingSummary: '',
      },
      alerts: {
        missingCheckin: {
          title: '',
          message: '',
          action: '',
        },
        suggestedEnd: {
          titleExceeded: '',
          titleAligned: '',
          messageExceeded: '',
          messageAligned: '',
          action: '',
        },
        suggestedStart: {
          titlePositive: '',
          titleNegative: '',
          messagePositive: '',
          messageNegative: '',
          action: '',
        },
        breakReminder: {
          title: '',
          message: '',
          action: '',
        },
        weeklyBalance: {
          titlePositive: '',
          titleNegative: '',
          messagePositive: '',
          messageNegative: '',
          action: '',
        },
        incidentsPending: {
          title: '',
          message: '',
          action: '',
        },
        balancedDay: {
          title: '',
          message: '',
          action: '',
        },
      },
    },
    users: {
      page: {
        kicker: '',
        title: '',
        subtitle: '',
        newUser: '',
        statsAriaLabel: '',
        stats: {
          total: '',
          active: '',
          inactive: '',
          admins: '',
        },
        filters: {
          title: '',
          subtitle: '',
          search: '',
          searchPlaceholder: '',
          role: '',
          status: '',
          all: '',
          active: '',
          inactive: '',
        },
        table: {
          title: '',
          subtitle: '',
          user: '',
          role: '',
          address: '',
          weeklyHours: '',
          status: '',
          actions: '',
          empty: '',
          hoursSuffix: '',
          noManager: '',
          active: '',
          inactive: '',
          tooltipActivate: '',
          tooltipDeactivate: '',
          tooltipEdit: '',
          tooltipDelete: '',
        },
      },
      modal: {
        kicker: '',
        createTitle: '',
        editTitle: '',
        subtitle: '',
        close: '',
        fields: {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: '',
          area: '',
          address: '',
          community: '',
          weeklyHours: '',
          manager: '',
          active: '',
        },
        placeholders: {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          area: '',
          address: '',
        },
        noManager: '',
        save: '',
        create: '',
        cancel: '',
      },
      roles: {
        admin: '',
        manager: '',
        employee: '',
      },
      communities: {
        madrid: '',
        galicia: '',
      },
      feedback: {
        editUser: '',
        selfDeactivateBlocked: '',
        selfDeleteBlocked: '',
        userUpdated: '',
        userCreated: '',
        userActivated: '',
        userDeactivated: '',
        userDeleted: '',
        editCancelled: '',
      },
      confirm: {
        defaultTitle: '',
        defaultMessage: '',
        defaultLabel: '',
        activateTitle: '',
        deactivateTitle: '',
        activateMessage: '',
        deactivateMessage: '',
        activateLabel: '',
        deactivateLabel: '',
        deleteTitle: '',
        deleteMessage: '',
        deleteLabel: '',
      },
    },
    alerts: {
      assistant: {
        reviewedTitle: '',
        reviewedMessage: '',
        removedTitle: '',
        removedMessage: '',
        clearedTitle: '',
        clearedMessage: '',
      },
      users: {
        actionNotAllowedTitle: '',
      },
      checkins: {
        blockedTitle: '',
        approvedDayTitle: '',
        registeredTitle: '',
        registeredMessage: '',
      },
      incidents: {
        approvedSingleTitle: '',
        approvedMultipleTitle: '',
      },
    },
  };
}
