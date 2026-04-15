"use client";

import { useEffect, useState } from "react";

const LOCATION = {
  name: "Lofoten",
  country: "Norway",
  latitude: 68.234,
  longitude: 14.568,
};

type WeatherResponse = {
  current?: {
    temperature_2m: number;
  };
  current_units?: {
    temperature_2m: string;
  };
  timezone?: string;
};

function formatTime(now: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(now);
}

export default function Home() {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [unit, setUnit] = useState("°");
  const [timezone, setTimezone] = useState("Europe/Oslo");
  const [now, setNow] = useState(() => new Date());
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      setStatus("loading");

      try {
        const params = new URLSearchParams({
          latitude: String(LOCATION.latitude),
          longitude: String(LOCATION.longitude),
          current: "temperature_2m",
          timezone: "auto",
        });

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Weather request failed");
        }

        const data = (await response.json()) as WeatherResponse;

        if (!data.current || !data.current_units || !data.timezone) {
          throw new Error("Weather response was incomplete");
        }

        setTemperature(data.current.temperature_2m);
        setUnit(data.current_units.temperature_2m);
        setTimezone(data.timezone);
        setStatus("success");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(error);
        setStatus("error");
      }
    }

    loadWeather();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const temperatureLabel =
    status === "loading"
      ? "--"
      : status === "error" || temperature === null
        ? "??"
        : `${Math.round(temperature)}${unit.replace("C", "")}`;

  const timeLabel = formatTime(now, timezone);
  const statusCopy = {
    loading: "Fetching the latest temperature from Open-Meteo...",
    success: "Live weather for the Lofoten islands.",
    error: "Weather unavailable right now. Check your connection and retry.",
  }[status];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#a9b0ab_0%,_#7b837e_28%,_#555d59_62%,_#3a423f_100%)] px-5 py-6 text-white sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
        <section className="weather-card weather-grain relative isolate aspect-square w-full max-w-[760px] overflow-hidden rounded-[2rem] px-6 py-6 shadow-[0_32px_90px_rgba(15,18,20,0.28)] sm:px-10 sm:py-10">
          <div className="weather-moon absolute left-1/2 top-[27%] h-20 w-20 -translate-x-1/2 rounded-full bg-white/12 blur-[1px] sm:h-28 sm:w-28" />
          <div className="weather-ridge weather-ridge-back absolute inset-x-0 bottom-[24%] h-[38%]" />
          <div className="weather-ridge weather-ridge-mid absolute bottom-[11%] left-[-4%] h-[62%] w-[54%]" />
          <div className="weather-ridge weather-ridge-right absolute bottom-[10%] right-[-2%] h-[49%] w-[47%]" />
          <div className="weather-ridge weather-ridge-front absolute inset-x-0 bottom-0 h-[20%]" />
          <div className="weather-water absolute inset-x-0 bottom-0 h-[15%]" />
          <div className="weather-shore weather-shore-left absolute bottom-[10%] left-0 h-[15%] w-[42%]" />
          <div className="weather-shore weather-shore-right absolute bottom-[9%] right-0 h-[13%] w-[33%]" />

          <div className="weather-tree weather-tree-left-1 absolute bottom-[13%] left-[6%]" />
          <div className="weather-tree weather-tree-left-2 absolute bottom-[14%] left-[11%]" />
          <div className="weather-tree weather-tree-left-3 absolute bottom-[13.5%] left-[16%]" />
          <div className="weather-tree weather-tree-left-4 absolute bottom-[11.5%] left-[23%]" />
          <div className="weather-tree weather-tree-center-1 absolute bottom-[12.5%] left-[46%]" />
          <div className="weather-tree weather-tree-center-2 absolute bottom-[12.5%] left-[49%]" />
          <div className="weather-tree weather-tree-right-1 absolute bottom-[13.5%] right-[13%]" />
          <div className="weather-tree weather-tree-right-2 absolute bottom-[12%] right-[8%]" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
                  Today
                </p>
                <p className="mt-2 text-[clamp(1.55rem,3vw,2.6rem)] font-semibold leading-none tracking-[-0.04em]">
                  {timeLabel}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[clamp(5rem,16vw,10rem)] font-semibold leading-[0.8] tracking-[-0.08em]">
                  {temperatureLabel}
                </p>
              </div>
            </div>

            <div className="max-w-xs">
              <p className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
                {LOCATION.name}
              </p>
              <p className="mt-2 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
                {LOCATION.country}
              </p>
              <p className="mt-5 max-w-[18rem] text-sm font-medium text-white/76 sm:text-base">
                {statusCopy}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
