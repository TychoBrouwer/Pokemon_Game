import math

levels = {}
levels['erratic'] = {}
levels['fast'] = {}
levels['slow'] = {}
levels['medium-slow'] = {}
levels['medium-fast'] = {}
levels['fluctuating'] = {}

for n in range(1, 101):
  if n < 50:
    levels['erratic'][n] = round((n ** 3 * (100 - n)) / 50, 1)
  elif 50 <= n < 68:
    levels['erratic'][n] = round((n ** 3 * (150 - n)) / 100, 1)
  elif 68 <= n < 98:
    levels['erratic'][n] = round((n ** 3 * math.floor((1911 - 10 * n) / 3)) / 500, 1)
  elif 98 <= n <= 100:
    levels['erratic'][n] = round((n ** 3 * (160 - n)) / 100, 1)

  levels['fast'][n] = round((4 * n ** 3) / 5, 1)
  levels['medium-fast'][n] = round(n ** 3, 1)
  levels['medium-slow'][n] = round((6 / 5) * n ** 3 - 15 * n ** 2 + 100 * n - 140, 1)
  levels['slow'][n] = round((5 * n ** 3) / 4, 1)

  if n < 15:
    levels['fluctuating'][n] = round(n ** 3 * ((math.floor((n + 1) / 3) + 24) / 50), 1)
  elif 15 <= n < 36:
    levels['fluctuating'][n] = round(n ** 3 * ((n + 14) / 50), 1)
  elif 36 <= n <= 100:
    levels['fluctuating'][n] = round(n ** 3 * ((math.floor(n / 2) + 32) / 50), 1)
  
  if levels['fluctuating'][n] < 0:
    levels['fluctuating'][n] = 0

  if levels['slow'][n] < 0:
    levels['slow'][n] = 0

  if levels['medium-slow'][n] < 0:
    levels['medium-slow'][n] = 0

  if levels['medium-fast'][n] < 0:
    levels['medium-fast'][n] = 0

  if levels['fast'][n] < 0:
    levels['fast'][n] = 0

  if levels['erratic'][n] < 0: 
    levels['erratic'][n] = 0

print(levels)