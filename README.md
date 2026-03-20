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
'''cd src/backend'''
'''python main.py'''

2. В новом терминале(в VS Code Terminal -> New Terminal) перейти в директорию src/frontend И запустить его на порте 8001:
'''cd src/frontend'''
'''python -m http.server 8001'''

3. Открыть http://localhost:8001 у себя в браузере и наслаждаться результатом