-- ============================================================
-- Nexpense – Analytics RPC Függvények
-- ============================================================

-- Havi összesítő
CREATE OR REPLACE FUNCTION public.get_monthly_summary(
  p_user_id UUID,
  p_year    INTEGER,
  p_month   INTEGER
)
RETURNS TABLE (
  total_amount       DECIMAL,
  transaction_count  BIGINT,
  top_category_id    UUID,
  avg_per_day        DECIMAL
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    COALESCE(SUM(amount), 0)  AS total_amount,
    COUNT(*)                   AS transaction_count,
    (SELECT category_id FROM public.expenses
     WHERE user_id = p_user_id AND is_deleted = FALSE
       AND EXTRACT(YEAR FROM expense_date) = p_year
       AND EXTRACT(MONTH FROM expense_date) = p_month
       AND category_id IS NOT NULL
     GROUP BY category_id ORDER BY SUM(amount) DESC LIMIT 1) AS top_category_id,
    COALESCE(SUM(amount) / NULLIF(COUNT(DISTINCT expense_date), 0), 0) AS avg_per_day
  FROM public.expenses
  WHERE user_id = p_user_id
    AND is_deleted = FALSE
    AND EXTRACT(YEAR FROM expense_date) = p_year
    AND EXTRACT(MONTH FROM expense_date) = p_month;
$$;

-- Kategória részletezés (időszakra)
CREATE OR REPLACE FUNCTION public.get_category_breakdown(
  p_user_id   UUID,
  p_start     DATE,
  p_end       DATE
)
RETURNS TABLE (
  category_id       UUID,
  category_name     TEXT,
  category_icon     TEXT,
  category_color    TEXT,
  total_amount      DECIMAL,
  transaction_count BIGINT,
  percentage        DECIMAL
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH totals AS (
    SELECT SUM(amount) AS grand_total
    FROM public.expenses
    WHERE user_id = p_user_id AND is_deleted = FALSE
      AND expense_date BETWEEN p_start AND p_end
  )
  SELECT
    c.id,
    c.name,
    c.icon,
    c.color,
    COALESCE(SUM(e.amount), 0),
    COUNT(e.id),
    ROUND(COALESCE(SUM(e.amount), 0) / NULLIF((SELECT grand_total FROM totals), 0) * 100, 1)
  FROM public.categories c
  LEFT JOIN public.expenses e
    ON e.category_id = c.id
    AND e.user_id = p_user_id
    AND e.is_deleted = FALSE
    AND e.expense_date BETWEEN p_start AND p_end
  WHERE c.user_id IS NULL OR c.user_id = p_user_id
  GROUP BY c.id, c.name, c.icon, c.color
  HAVING SUM(e.amount) > 0
  ORDER BY SUM(e.amount) DESC NULLS LAST;
$$;

-- Napi trendek (elmúlt N hónap)
CREATE OR REPLACE FUNCTION public.get_spending_trends(
  p_user_id    UUID,
  p_months_back INTEGER DEFAULT 6
)
RETURNS TABLE (
  month        DATE,
  total_amount DECIMAL,
  avg_amount   DECIMAL,
  tx_count     BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    DATE_TRUNC('month', expense_date)::DATE AS month,
    SUM(amount),
    AVG(amount),
    COUNT(*)
  FROM public.expenses
  WHERE user_id = p_user_id
    AND is_deleted = FALSE
    AND expense_date >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL
  GROUP BY DATE_TRUNC('month', expense_date)
  ORDER BY month ASC;
$$;

-- Hét napja szerinti statisztika
CREATE OR REPLACE FUNCTION public.get_day_of_week_stats(
  p_user_id    UUID,
  p_months_back INTEGER DEFAULT 3
)
RETURNS TABLE (
  day_of_week  INTEGER,  -- 0=vasárnap, 1=hétfő, ... 6=szombat
  avg_amount   DECIMAL,
  total_amount DECIMAL,
  tx_count     BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    EXTRACT(DOW FROM expense_date)::INTEGER AS day_of_week,
    AVG(amount),
    SUM(amount),
    COUNT(*)
  FROM public.expenses
  WHERE user_id = p_user_id
    AND is_deleted = FALSE
    AND expense_date >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL
  GROUP BY EXTRACT(DOW FROM expense_date)
  ORDER BY day_of_week;
$$;
