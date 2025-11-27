# دليل تشغيل منصة ZainJo Watchtower

هذا المستند يشرح كيفية تشغيل المنصة، ربطها بالأنظمة الحقيقية، وتعديل قواعد التنبيهات.

## 1. نظرة عامة على النظام (Architecture)

يتكون النظام من جزئين رئيسيين:

1.  **الواجهة الأمامية (Frontend)**:
    *   تعمل هنا على Replit.
    *   تعرض البيانات، التنبيهات، والتقارير.
    *   في الوضع الحالي (Prototype)، تقوم بمحاكاة البيانات.

2.  **الخادم الخلفي (Backend)**:
    *   هو الملف `server.py` الموجود في هذا المشروع.
    *   **يجب تحميله وتشغيله على جهازك (Ubuntu VM)** وليس على Replit.
    *   هو المسؤول عن استلام السجلات الحقيقية من Huawei NMS عبر بروتوكول Syslog (UDP 1514).

---

## 2. كيفية التشغيل مع البيانات الحقيقية

لتحويل النظام من "محاكاة" إلى "حقيقي"، اتبع الخطوات التالية:

### الخطوة 1: إعداد الخادم (Ubuntu VM)
1.  قم بتحميل الملفين `server.py` و `requirements-backend.txt` من هذا المشروع إلى جهاز الـ VM الخاص بك.
2.  ثبت المكتبات المطلوبة:
    ```bash
    pip install -r requirements-backend.txt
    ```
3.  شغل الخادم:
    ```bash
    python server.py
    ```
    *سيقوم هذا السكريبت بفتح المنفذ 1514 لاستلام السجلات.*

### الخطوة 2: ربط أنظمة Huawei
اذهب إلى إعدادات Huawei NMS (أو أي نظام تريد مراقبته) واضبط إعدادات تصدير السجلات (Log Forwarding / Syslog) كالتالي:
*   **IP Address**: عنوان الـ IP الخاص بجهاز الـ Ubuntu VM.
*   **Port**: 1514
*   **Protocol**: UDP
*   **Format**: يفضل استخدام CEF أو التنسيق الافتراضي (CSV).

---

## 3. كيف أحدد القواعد (Rules)؟

الذكاء الحقيقي للنظام يكمن في "محرك القواعد".

### في النسخة الحالية (المحاكاة على Replit):
القواعد موجودة في الملف: `client/src/lib/rules-engine.ts`.
يمكنك تعديلها هنا لرؤية كيف ستظهر التنبيهات في الواجهة.

**مثال على قاعدة حالية:**
```typescript
// إذا كانت العملية "DELETE_LOGS"
if (parsed.operation === 'DELETE_LOGS') {
  // أطلق تنبيه "Critical"
  alerts.push({ severity: 'critical', rule: 'FORBIDDEN_OPERATION' ... });
}
```

### في النسخة الحقيقية (على الـ VM):
عندما تشغل `server.py` على جهازك، يجب عليك نقل المنطق (Logic) من ملف `rules-engine.ts` (Javascript) إلى دالة `evaluate_rules` داخل `server.py` (Python).

**مثال (Python):**
```python
def evaluate_rules(event):
    alerts = []
    # قاعدة: منع حذف السجلات
    if event.get('operation') == 'DELETE_LOGS':
        alerts.append({
            'rule': 'FORBIDDEN_OPERATION',
            'severity': 'critical',
            'details': f"User {event.get('user')} tried to delete logs"
        })
    return alerts
```

---

## 4. لوحة التحكم (Dashboard)

*   **Dashboard**: نظرة عامة حية.
*   **Alerts**: التنبيهات الأمنية الناتجة عن القواعد.
*   **Reports**: تقارير أسبوعية توضح أداء كل نظام (Huawei NMS, BSC, OSS).
*   **Login**: للدخول الآمن (الافتراضي: أي اسم مستخدم وكلمة مرور للتجربة).

---

## ملخص
1. حمل `server.py` على سيرفرك.
2. وجه أنظمة هواوي لترسل اللوجز لـ IP سيرفرك.
3. عدل القواعد في `server.py` لتناسب سياساتك الأمنية.
4. الواجهة هنا (Replit) هي للعرض فقط حالياً.
