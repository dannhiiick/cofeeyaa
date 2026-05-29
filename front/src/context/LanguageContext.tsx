import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type Language = 'ru' | 'kk' | 'en';

type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
  ru: {
    'sidebar.title': 'ВСТРЕЧА',
    'sidebar.subtitle': 'Кофейня ИС',
    'sidebar.desktop': 'Рабочий стол',
    'sidebar.pos': 'Касса POS',
    'sidebar.crm': 'Клиенты CRM',
    'sidebar.warehouse': 'Склад и учет',
    'sidebar.analytics': 'Аналитика',
    'sidebar.sandbox': 'Сынақ алгоритмдері', // matching the user's specific request
    'sidebar.profile': 'Профиль',
    'sidebar.activeRole': 'Активная роль:',
    'sidebar.roleManager': 'Менеджер (CRM & POS)',
    'sidebar.roleAdmin': 'Администратор (Склад)',
    'sidebar.roleDirector': 'Руководитель (Отчеты)',
    'sidebar.elena': 'Менеджер Елена В.',

    'header.notifications': 'Складские оповещения',
    'header.noAlerts': 'Все ингредиенты на складе в достаточном объеме!',
    'header.openWarehouse': 'Открыть склад',
    'header.myProfile': 'Мой профиль',
    'header.logout': 'Выйти',
    'header.welcome': 'Добро пожаловать в ИС кофейни, Elena В.!',

    'banner.title': 'Кофейня «Встреча»',
    'banner.welcome': 'Информационная Система Малого Предприятия',
    'banner.desc': 'Интегрированное веб-приложение для сквозной автоматизации ключевых бизнес-процессов: от кассового учета (POS) и ведения базы клиентов (CRM) до автоматического списания складских остатков и финансовой аналитики.',
    'banner.sandbox': 'Песочница алгоритмов',
    'banner.settings': 'Мой профиль',

    'food.title': 'Сетка блюд и напитков / Тағамдар мен сусындар торы',
    'food.espresso': 'Эспрессо',
    'food.espresso.desc': 'Крепкий классический эспрессо из 100% Арабики.',
    'food.cappuccino': 'Капучино',
    'food.cappuccino.desc': 'Эспрессо со взбитым молоком и нежной пенкой.',
    'food.latte': 'Латте Макиато',
    'food.latte.desc': 'Слоистый кофейно-молочный напиток в высоком бокале.',
    'food.caramelLatte': 'Карамельный Латте',
    'food.caramelLatte.desc': 'Нежный латте со сладким карамельным сиропом.',
    'food.croissant': 'Круассан с маслом',
    'food.croissant.desc': 'Свежеиспеченный французский слоеный круассан.',
    'food.cookie': 'Шоколадное печенье',
    'food.cookie.desc': 'Ароматное печенье с кусочками темного шоколада.',

    'warehouse.title': 'Қорларды басқару / Управление складом',
    'warehouse.ingredient': 'Ингредиент / Ингредиент',
    'warehouse.available': 'БАР / ЕСТЬ',
    'warehouse.critical': 'КРИТИКАЛЫҚ ДЕҢГЕЙ / КРИТИЧЕСКИЙ УРОВЕНЬ',
    'warehouse.beans': 'Кофе бұршақтары / Кофейные зерна',
    'warehouse.milk': 'Сүт / Молоко',
    'warehouse.sugar': 'Қант / Сахар',
    'warehouse.syrup': 'Сироп / Сироп',
    'warehouse.cups250': 'Стақандар 250мл / Стаканы 250мл',
    'warehouse.cups400': 'Стақандар 400мл / Стаканы 400мл',
    'warehouse.cookies': 'Шоколадты печенье / Шоколадное печенье',
    'warehouse.croissants': 'Круассандар / Круассаны',

    'crm.title': 'Клиенттер CRM / Клиентская CRM',
    'crm.search': 'Поиск гостей...',
    'crm.levels': 'Уровни лояльности гостей:',
    'crm.login': 'КІРУ / ВХОД',
    'crm.bronze': 'Қола 5% / Бронза 5%',
    'crm.silver': 'Күміс 10% / Серебро 10%',
    'crm.gold': 'Алтын 15% / Золото 15%',
    'crm.example': 'Пример активного гостя:',
    'crm.guestName': 'Иван И. (Gold)',
    'crm.phone': 'Телефон',
    'crm.bonuses': 'Баланс',
    'crm.spent': 'Потрачено',

    'analytics.title': 'Директор аналитикасы / Аналитика Директора',
    'analytics.revenue': 'Выручка (7 дней)',
    'analytics.profit': 'Чистая прибыль',
    'analytics.margin': 'Рентабельность меню',
    'analytics.desc': 'Выработка по подтвержденным чекам POS в реальном времени',

    'flowchart.title': 'Сынақ алгоритмдері / Тестовые алгоритмы',
    'flowchart.step1': 'Проверка базы данных',
    'flowchart.step2': 'Товар в наличии?',
    'flowchart.step3': 'Расчет бонуса',
    'flowchart.step4': 'Применение скидки',
    'flowchart.success': 'ОДОБРЕНО',
    'flowchart.error': 'Ошибка списания',
    'flowchart.logTitle': 'Шаг трассировки алгоритма',
  },
  kk: {
    'sidebar.title': 'ВСТРЕЧА',
    'sidebar.subtitle': 'Кофехана АЖ',
    'sidebar.desktop': 'Жұмыс үстелі',
    'sidebar.pos': 'POS кассасы',
    'sidebar.crm': 'CRM клиенттері',
    'sidebar.warehouse': 'Қорлар және есеп',
    'sidebar.analytics': 'Аналитика',
    'sidebar.sandbox': 'Сынақ алгоритмдері',
    'sidebar.profile': 'Профиль',
    'sidebar.activeRole': 'Белсенді рөл:',
    'sidebar.roleManager': 'Менеджер (CRM & POS)',
    'sidebar.roleAdmin': 'Әкімші (Қойма)',
    'sidebar.roleDirector': 'Директор (Есептер)',
    'sidebar.elena': 'Менеджер Елена В.',

    'header.notifications': 'Қойма хабарламалары',
    'header.noAlerts': 'Қоймадағы барлық ингредиенттер жеткілікті мөлшерде!',
    'header.openWarehouse': 'Қойманы ашу',
    'header.myProfile': 'Менің профилім',
    'header.logout': 'Шығу',
    'header.welcome': 'Кофехана АЖ-не қош келдіңіз, Elena В.!',

    'banner.title': '«Встреча» кофеханасы',
    'banner.welcome': 'Шағын кәсіпорынның ақпараттық жүйесі',
    'banner.desc': 'Кассалық есептен (POS) және клиенттер базасын жүргізуден (CRM) бастап қойма қалдықтарын автоматты түрде есептен шығаруға және қаржылық аналитикаға дейінгі негізгі бизнес-процестерді толық автоматтандыруға арналған интеграцияланған веб-қосымша.',
    'banner.sandbox': 'Сынақ алгоритмдері',
    'banner.settings': 'Менің профилім',

    'food.title': 'Тағамдар мен сусындар торы / Сетка блюд и напитков',
    'food.espresso': 'Эспрессо',
    'food.espresso.desc': '100% Арабикадан жасалған классикалық қою кофе.',
    'food.cappuccino': 'Капучино',
    'food.cappuccino.desc': 'Көпіртілген сүт пен жұмсақ көбігі бар эспрессо.',
    'food.latte': 'Латте Макиато',
    'food.latte.desc': 'Биік шыныаяқтағы қабатты кофе-сүт сусыны.',
    'food.caramelLatte': 'Карамельді Латте',
    'food.caramelLatte.desc': 'Тәтті карамель сиропы қосылған жұмсақ латте.',
    'food.croissant': 'Майлы круассан',
    'food.croissant.desc': 'Жаңа піскен француздық майлы круассан.',
    'food.cookie': 'Шоколадты печенье',
    'food.cookie.desc': 'Қара шоколад бөліктері қосылған хош иісті печенье.',

    'warehouse.title': 'Қорларды басқару / Управление складом',
    'warehouse.ingredient': 'Ингредиент / Ингредиент',
    'warehouse.available': 'БАР / ЕСТЬ',
    'warehouse.critical': 'КРИТИКАЛЫҚ ДЕҢГЕЙ / КРИТИЧЕСКИЙ УРОВЕНЬ',
    'warehouse.beans': 'Кофе бұршақтары / Кофейные зерна',
    'warehouse.milk': 'Сүт / Молоко',
    'warehouse.sugar': 'Қант / Сахар',
    'warehouse.syrup': 'Сироп / Сироп',
    'warehouse.cups250': 'Стақандар 250мл / Стаканы 250мл',
    'warehouse.cups400': 'Стақандар 400мл / Стаканы 400мл',
    'warehouse.cookies': 'Шоколадты печенье / Шоколадное печенье',
    'warehouse.croissants': 'Круассандар / Круассаны',

    'crm.title': 'Клиенттер CRM / Клиентская CRM',
    'crm.search': 'Қонақтарды іздеу...',
    'crm.levels': 'Қонақтардың адалдық деңгейлері:',
    'crm.login': 'КІРУ / ВХОД',
    'crm.bronze': 'Қола 5% / Бронза 5%',
    'crm.silver': 'Күміс 10% / Серебро 10%',
    'crm.gold': 'Алтын 15% / Золото 15%',
    'crm.example': 'Белсенді қонақтың мысалы:',
    'crm.guestName': 'Иван И. (Gold)',
    'crm.phone': 'Телефон',
    'crm.bonuses': 'Баланс',
    'crm.spent': 'Жұмсалды',

    'analytics.title': 'Директор аналитикасы / Аналитика Директора',
    'analytics.revenue': 'Апталық түсім (7 күн)',
    'analytics.profit': 'Таза пайда',
    'analytics.margin': 'Мәзір маржасы',
    'analytics.desc': 'Реалды уақыттағы расталған POS чектері бойынша есептер',

    'flowchart.title': 'Сынақ алгоритмдері / Тестовые алгоритмы',
    'flowchart.step1': 'Дерекқорды тексеру',
    'flowchart.step2': 'Тауар бар ма?',
    'flowchart.step3': 'Бонус есептеу',
    'flowchart.step4': 'Скидканы қолдану',
    'flowchart.success': 'МАҚҰЛДАНДЫ',
    'flowchart.error': 'Есептен шығару қатесі',
    'flowchart.logTitle': 'Алгоритм трассировкасының қадамы',
  },
  en: {
    'sidebar.title': 'VSTRECHA',
    'sidebar.subtitle': 'Coffee Shop IS',
    'sidebar.desktop': 'Dashboard',
    'sidebar.pos': 'POS Terminal',
    'sidebar.crm': 'CRM Customers',
    'sidebar.warehouse': 'Warehouse & Stock',
    'sidebar.analytics': 'Analytics',
    'sidebar.sandbox': 'Algorithm Sandbox',
    'sidebar.profile': 'Profile',
    'sidebar.activeRole': 'Active Role:',
    'sidebar.roleManager': 'Manager (CRM & POS)',
    'sidebar.roleAdmin': 'Admin (Warehouse)',
    'sidebar.roleDirector': 'Director (Reports)',
    'sidebar.elena': 'Manager Elena V.',

    'header.notifications': 'Stock Alerts',
    'header.noAlerts': 'All ingredients are fully stocked!',
    'header.openWarehouse': 'Open Warehouse',
    'header.myProfile': 'My Profile',
    'header.logout': 'Logout',
    'header.welcome': 'Welcome to Coffee Shop IS, Elena V.!',

    'banner.title': 'Coffee Shop «Vstrecha»',
    'banner.welcome': 'Small Enterprise Information System',
    'banner.desc': 'Integrated web application for complete automation of key business processes: from POS cashier and CRM customer loyalty engine to automatic inventory deduction and director analytics.',
    'banner.sandbox': 'Algorithm Sandbox',
    'banner.settings': 'My Profile',

    'food.title': 'Food and Drinks Grid / Тағамдар мен сусындар торы',
    'food.espresso': 'Espresso',
    'food.espresso.desc': 'Rich, classic espresso brewed from 100% Arabica beans.',
    'food.cappuccino': 'Cappuccino',
    'food.cappuccino.desc': 'Espresso balanced with steamed milk and velvety foam.',
    'food.latte': 'Latte Macchiato',
    'food.latte.desc': 'Beautifully layered milk-forward espresso beverage.',
    'food.caramelLatte': 'Caramel Latte',
    'food.caramelLatte.desc': 'Smooth latte infused with sweet premium caramel syrup.',
    'food.croissant': 'Butter Croissant',
    'food.croissant.desc': 'Freshly baked flaky, buttery authentic French pastry.',
    'food.cookie': 'Chocolate Cookie',
    'food.cookie.desc': 'Fresh home-style cookie packed with rich chocolate chunks.',

    'warehouse.title': 'Inventory Management / Управление складом',
    'warehouse.ingredient': 'Ingredient / Ингредиент',
    'warehouse.available': 'BАР / EСТЬ',
    'warehouse.critical': 'КРИТИКАЛЫҚ ДЕҢГЕЙ / КРИТИЧЕСКИЙ УРОВЕНЬ',
    'warehouse.beans': 'Coffee Beans / Кофе бұршақтары',
    'warehouse.milk': 'Milk / Сүт',
    'warehouse.sugar': 'Sugar / Қант',
    'warehouse.syrup': 'Syrup / Сироп',
    'warehouse.cups250': 'Cups 250ml / Стаканы 250мл',
    'warehouse.cups400': 'Cups 400ml / Стаканы 400мл',
    'warehouse.cookies': 'Chocolate Cookie / Шоколадты печенье',
    'warehouse.croissants': 'Croissants / Круассандар',

    'crm.title': 'Client CRM / Клиентская CRM',
    'crm.search': 'Search guests...',
    'crm.levels': 'Guest Loyalty Levels:',
    'crm.login': 'KІРУ / ВХОД',
    'crm.bronze': 'Bronze 5% / Қола 5%',
    'crm.silver': 'Silver 10% / Күміс 10%',
    'crm.gold': 'Gold 15% / Алтын 15%',
    'crm.example': 'Active Guest Example:',
    'crm.guestName': 'Ivan I. (Gold)',
    'crm.phone': 'Phone',
    'crm.bonuses': 'Balance',
    'crm.spent': 'Spent',

    'analytics.title': 'Director Analytics / Аналитика Директора',
    'analytics.revenue': 'Revenue (7 Days)',
    'analytics.profit': 'Net Profit',
    'analytics.margin': 'Menu Margin',
    'analytics.desc': 'Real-time financial performance indicators from POS sales',

    'flowchart.title': 'Algorithm Sandbox / Тестовые алгоритмы',
    'flowchart.step1': 'Verify Database',
    'flowchart.step2': 'Item in Stock?',
    'flowchart.step3': 'Calculate Bonus',
    'flowchart.step4': 'Apply Discount',
    'flowchart.success': 'APPROVED',
    'flowchart.error': 'Deduction Error',
    'flowchart.logTitle': 'Algorithm Execution Step',
  },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('vstrecha_lang');
    return (saved as Language) || 'ru';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('vstrecha_lang', lang);
  };

  const t = (key: string): string => {
    return dictionaries[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
