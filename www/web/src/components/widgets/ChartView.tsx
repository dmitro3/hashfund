import { useEffect, useRef } from "react";
import * as TradeView from "@hashfund/chart";

import Api from "@/lib/api";
import { mapSwapToGraph } from "@/lib/api/models/graph.model";

type ChartViewProps = {
  width: number;
  height: number;
  locale?: TradeView.LanguageCode;
  mint: string;
};

export default function ChartView({
  width,
  height,
  mint,
  locale = "en",
}: ChartViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<TradeView.IChartingLibraryWidget | null>(null);

  useEffect(() => {
    if (container.current) {
      widget.current = new TradeView.widget({
        container: container.current,
        symbol: mint,
        width,
        height,
        locale,
        theme: "dark",
        debug: true,
        interval: "5" as TradeView.ResolutionString,
        datafeed: {
          async onReady(callback) {
            setTimeout(() =>
              callback({
                supports_time: true,
                supports_timescale_marks: true,
                supports_marks: true,
                supported_resolutions: ["5"] as TradeView.ResolutionString[],
              })
            );
          },
          searchSymbols(userInput, exchange, symbolType, onResult) {
            Api.instance.mint
              .getAllMints({ search: userInput, exchange, symbolType })
              .then(({ data }) =>
                onResult(
                  data.results.map((mint) => ({
                    symbol: mint.id,
                    full_name: mint.name,
                    description: mint.metadata.description,
                    exchange: "HashFund",
                    type: "Crypto",
                    ticker: mint.id,
                    logo_urls: [mint.metadata.image],
                    exchange_logo: "",
                  }))
                )
              );
          },
          async resolveSymbol(symbolName, onResolve, onError) {
            Api.instance.mint
              .getMint(symbolName)
              .then(({ data }) =>
                onResolve({
                  name: data.name,
                  ticker: data.ticker,
                  unit_id: data.id,
                  description: data.metadata.description,
                  logo_urls: [data.metadata.image],
                  type: "crypto",
                  exchange: "HashFund",
                  listed_exchange: "HashFund",
                  timezone: "Etc/UTC",
                  format: "price",
                  pricescale: 1,
                  minmov: 0.1,
                  visible_plots_set: "ohlc",
                  data_status: "streaming",
                  session: "24x7",
                  has_intraday: true,
                })
              )
              .catch(onError);
          },
          getBars(symbolInfo, resolution, periodParams, onResult, onError) {
            const from = new Date(periodParams.from * 1000);
            const to = new Date(periodParams.to * 1000);

            Api.instance.swap
              .getSwapsByMint(symbolInfo.unit_id!, {
                from: from.toISOString(),
                to: to.toISOString(),
                limit: periodParams.countBack,
                resolution,
              })
              .then(({ data }) => {
                const graph = mapSwapToGraph(data.results).sort(
                  (a, b) => a.time - b.time
                );
                console.log(graph);
                if (graph.length > 0) {
                  onResult(graph, { noData: false });
                }
              })
              .catch(console.log);
          },
          subscribeBars() {},
          unsubscribeBars() {},
        },

        enabled_features: ["seconds_resolution", "tick_resolution"],
      });
    }
  }, [container]);

  return <div ref={container} />;
}