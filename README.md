# route_optimization
Сервис для генерации и оптимизации городских маршрутов доставки.
## Структура проекта

 <pre>
route_optimization/
├── src/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── API/
│   │   │   │   ├── points.py
│   │   │   │   └── routes.py
│   │   │   ├── Models/
│   │   │   │   ├── point.py
│   │   │   │   └── route.py
│   │   │   ├── db.py
│   │   │   ├── generation.py
│   │   │   └── optimization.py
│   │   ├── database.db
│   │   └── main.py
│   └── frontend/
│       ├── css/
│       │   └── styles.css
│       ├── js/
│       │   ├── api.js
│       │   ├── app.js
│       │   └── map.js
│       └── index.html
├── tests/
│   └── . . .
├── .gitignore
├── requirements.txt
└── README.md
</pre>

## Инструкция по запуску:
1. Перейти в директорию src/backend и запустить его:
```shell
cd src/backend
python main.py
```

2. В новом терминале (в VS Code сделать Terminal -> New Terminal) перейти в директорию src/frontend И запустить его на порте 8001:
```shell
cd src/frontend
python -m http.server 8001
```

3. Открыть http://localhost:8001 у себя в браузере и наслаждаться результатом

## Выполнено:

### Backend
- Настроены API и база данных
- Реализована функция генерации точек

### Frontend
- Реализована главная страница
- Реализовано отображение сгенерированных точек

### Тестировщик / DevOps
- Настроены CI и CD
- Налажена связь Frontend с Backend