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
