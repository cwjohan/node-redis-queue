#worker01 memory usage:

```
$ node worker01.js mem | grep '>>>' | tee memusage.out
>>>LEAK =  { start: Fri Sep 19 2014 15:00:04 GMT-0700 (Pacific Daylight Ti
  end: Fri Sep 19 2014 15:01:50 GMT-0700 (Pacific Daylight Time),
  growth: 4474264,
  reason: 'heap growth over 5 consecutive GCs (1m 46s) - 144.92 mb/hr' }
>>>current = 12691640, max = 12691640
>>>current = 12898664, max = 13461120
>>>current = 14387672, max = 14387672
>>>current = 12854016, max = 14387672
>>>current = 12835544, max = 14387672
>>>current = 13515424, max = 14387672
>>>current = 12885592, max = 14387672
>>>current = 12907504, max = 14387672
>>>current = 12954256, max = 14387672
>>>current = 12956192, max = 14387672
>>>current = 13010464, max = 14387672
>>>LEAK =  { start: Fri Sep 19 2014 15:11:06 GMT-0700 (Pacific Daylight Time),
  end: Fri Sep 19 2014 15:14:50 GMT-0700 (Pacific Daylight Time),
  growth: 821880,
  reason: 'heap growth over 5 consecutive GCs (3m 44s) - 12.6 mb/hr' }
>>>current = 13729384, max = 14387672
>>>current = 13061264, max = 14387672
>>>current = 13066664, max = 14387672
>>>current = 13073688, max = 14387672
>>>current = 13087984, max = 14387672
>>>current = 13087408, max = 14387672
>>>current = 13762800, max = 14387672
>>>current = 13216432, max = 14387672
>>>current = 13214176, max = 14387672
...
```

Note that, after running provider01 several dozen times, max memory usage stabilizes at 14387672.
A couple of leaks are reported, but these are temporary issues due to the eventual memory
usage stabilization.
