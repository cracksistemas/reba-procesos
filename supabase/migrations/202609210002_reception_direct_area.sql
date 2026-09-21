-- Reception has direct processes and tasks, not organizational subareas.
-- Keep existing rows intact for auditability, but hide the temporary classification.
update public.processes p
set subarea_id = null
from public.areas a
where p.area_id = a.id
  and a.code = 'REC';

update public.subareas s
set is_active = false
from public.areas a
where s.area_id = a.id
  and a.code = 'REC'
  and s.code in ('REC-S01', 'REC-S02', 'REC-S03', 'REC-S04', 'REC-S05');
