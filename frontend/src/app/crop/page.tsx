"use client";
import styles from "./page.module.css";
import ReactLassoSelect, { getCanvas } from "react-lasso-select";
import { useEffect, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import { useAppDispatch, useAppSelector } from "../../components/reduxHooks";
import Link from "next/link";
import { processImage, saveCrop } from "../../components/UISlice";
import { useRouter } from "next/navigation";
export default function Crop() {
  const router = useRouter();
  const screenshot = useAppSelector((state: any) => state.uislice.currentScreenshot);
  const waterHarvesting = useAppSelector((state: any) => state.uislice.waterHarvesting);
  const [clippedImg, setClippedImg] = useState();
  const dispatch = useAppDispatch();
  return (
    <>
      {screenshot ? (
        <div className={styles.container}>
          <div className={styles.screenshotContainer}>
            <ReactLassoSelect
              style={{ borderRadius: "15px" }}
              src={screenshot}
              onComplete={(value: any) => {
                if (!value.length) return;
                getCanvas(screenshot, value, (err: any, canvas: any) => {
                  if (!err) {
                    setClippedImg(canvas.toDataURL());
                  }
                });
              }}
            />
          </div>
          <>
            <div className={styles.guidenceContainer}>
              {clippedImg
                ? waterHarvesting
                  ? "Roof area selected! Click Next to continue with rainwater setup."
                  : "Roof area selected! Click Next to continue with solar analysis."
                : "Please mark points over the roof to select the area for analysis"}
            </div>
            <div className={styles.buttonContainer}>
              <button onClick={() => setClippedImg(undefined)} className={styles.clearButton}>
                <span style={{ marginLeft: "10px" }}>Clear</span>
                <MdDeleteOutline className={styles.clearBoxIcon} />
              </button>
              <button
                onClick={() => {
                  if (clippedImg) {
                    console.log('Saving crop data:', clippedImg);
                    dispatch(saveCrop(clippedImg));
                    // Small delay to ensure Redux state is updated before navigation
                    setTimeout(() => {
                      console.log('Navigating to next step');
                      router.push(waterHarvesting ? "/rainwater-input" : "/userinput");
                    }, 200);
                  } else {
                    alert('Please select an area on the roof first');
                  }
                }}
                className={`${styles.nextButton} ${!clippedImg ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!clippedImg}
              >
                <span style={{ marginRight: "25px" }}>Next</span>
                <FaArrowRight className={styles.nextBoxIcon} />
              </button>
            </div>
            <div className={styles.ball1}>&nbsp;&nbsp;</div>
            <div className={styles.ball2}>&nbsp;&nbsp;</div>
            <div className={styles.ball3}>&nbsp;&nbsp;</div>
            <div className={styles.ball4}>&nbsp;&nbsp;</div>
          </>
        </div>
      ) : (
        <span>Loading...</span>
      )}
    </>
  );
}
